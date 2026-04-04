#!/usr/bin/env python3
"""
GitHub Awesome Daily Brief → Nomi Brief
=========================================
Multi-source aggregator: GitHub Trending, GitHubAwesome RSS, Hacker News,
Lobsters, Reddit r/Programming, and more. Enriches with GitHub API,
generates AI TLDRs via MiniMax, and publishes ranked articles to Nomi Brief.
"""

import json
import os
import sys
import hashlib
import re
import subprocess
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
from collections import defaultdict

# Database integration
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    from db_helper import init_db, article_exists, insert_article, insert_github_project, get_connection
    DB_AVAILABLE = True
except ImportError:
    DB_AVAILABLE = False
    print("⚠️ db_helper not available, running without database")

# ─── Config ───────────────────────────────────────────────────────────────────

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
MINIMAX_API_KEY = os.environ.get("MINIMAX_API_KEY", "")
MINIMAX_BASE_URL = "https://api.minimax.io/v1"

# RSS Sources
RSS_SOURCES = {
    "github_trending": "https://github.com/trending.atom",
    "github_awesome": "https://githubawesome.com/rss/",
    "hacker_news": "https://hnrss.org/frontpage",
    "lobsters": "https://lobste.rs/rss",
    "reddit_programming": "https://www.reddit.com/r/programming/.rss",
}

# YouTube
GITHUB_AWESOME_YOUTUBE_CHANNEL_ID = "UC9Rrud-8CaHokDtK9FszvRg"
YOUTUBE_RSS = f"https://www.youtube.com/feeds/videos.xml?channel_id={GITHUB_AWESOME_YOUTUBE_CHANNEL_ID}"

# Nomi Brief Webhook
WEBHOOK_URL = "https://brief.unschackle.com/api/webhook"
WEBHOOK_SECRET = os.environ.get("NOMI_BRIEF_WEBHOOK_SECRET", "")

# Nomi Brief LinkEntry API
LINKENTRY_API_URL = "https://brief.unschackle.com/api/links"
LINKENTRY_API_SECRET = os.environ.get("NOMI_BRIEF_WEBHOOK_SECRET", "")

# Dedup
DEDUP_FILE = os.path.expanduser("~/.nomi-brief-github-videos.json")

# Limits
MAX_AGE_DAYS = 2
MAX_ENTRIES = 20
MAX_GITHUB_API_REQS = 25  # Safety cap to avoid rate limit
GITHUB_API_DELAY = 0.4   # Seconds between API calls
MINIMAX_BATCH_SIZE = 5   # Items per TLDR generation call

# ─── Helpers ──────────────────────────────────────────────────────────────────

def log(msg, emoji="i️"):
    print(f"{emoji} {msg}", flush=True)


def fetch_url(url, timeout=15, headers=None):
    """Fetch a URL and return the response body as string."""
    h = {"User-Agent": "NomiBrief/1.0 (RSS Aggregator)"}
    if headers:
        h.update(headers)
    req = Request(url, headers=h)
    try:
        with urlopen(req, timeout=timeout) as resp:
            return resp.read().decode("utf-8")
    except HTTPError as e:
        if e.code == 429:
            log(f"Rate limited fetching {url}, waiting...", "⏳")
            time.sleep(5)
            return fetch_url(url, timeout, headers)
        raise


def parse_iso_date(date_str):
    """Parse various date formats into a datetime."""
    if not date_str:
        return None
    date_str = date_str.strip()
    for fmt in [
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%SZ",
        "%a, %d %b %Y %H:%M:%S %Z",
        "%a, %d %b %Y %H:%M:%S GMT",
        "%Y-%m-%dT%H:%M:%S.%fZ",
        "%Y-%m-%d",
    ]:
        try:
            dt = datetime.strptime(date_str, fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except ValueError:
            continue
    try:
        from email.utils import parsedate_to_datetime
        return parsedate_to_datetime(date_str)
    except Exception:
        return None


def is_recent(dt, max_age_days=MAX_AGE_DAYS):
    if dt is None:
        return True  # Be inclusive if date unknown
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=max_age_days)
    return dt >= cutoff


def entry_id(url_or_id):
    return hashlib.sha256(url_or_id.encode()).hexdigest()[:16]


def extract_youtube_id(text):
    """Extract a YouTube video ID from text."""
    patterns = [
        r'youtube\.com/embed/([a-zA-Z0-9_-]{11})',
        r'youtube\.com/watch\?v=([a-zA-Z0-9_-]{11})',
        r'youtu\.be/([a-zA-Z0-9_-]{11})',
    ]
    for pat in patterns:
        m = re.search(pat, text)
        if m:
            return m.group(1)
    return None


def extract_github_repos(text):
    """Extract GitHub repo 'owner/repo' from text."""
    if not text:
        return []
    pattern = r'github\.com/([a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+)'
    repos = list(set(re.findall(pattern, text, re.IGNORECASE)))
    # Filter out likely non-repo URLs
    return [r for r in repos if len(r.split('/')) == 2 and 'github.com' not in r]


def strip_html(text):
    if not text:
        return ""
    return re.sub(r'<[^>]+>', '', text).strip()


# ─── GitHub API ────────────────────────────────────────────────────────────────

def github_api_get(path, params=None):
    """Make an authenticated GitHub API request with rate-limit handling."""
    url = f"https://api.github.com{path}"
    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "NomiBrief/1.0",
        "X-GitHub-Api-Fly": "NomiBrief",
    }
    if params:
        url += "?" + "&".join(f"{k}={v}" for k, v in params.items())

    try:
        data = fetch_url(url, headers=headers)
        if data is None:
            return None
        return json.loads(data)
    except HTTPError as e:
        if e.code == 403:
            # Check rate limit
            try:
                if 'rate limit' in e.read().decode().lower():
                    log("GitHub API rate limit hit. Backing off 60s...", "⚠️")
                    time.sleep(60)
                    return None
            except:
                pass
        return None
    except Exception as e:
        log(f"GitHub API error for {path}: {e}", "⚠️")
        return None


def enrich_repo(owner, repo):
    """Enrich a repo with full GitHub API data."""
    data = github_api_get(f"/repos/{owner}/{repo}")
    if not data or isinstance(data, dict) and data.get("message"):
        return None
    return {
        "owner": owner,
        "repo": repo,
        "full_name": data.get("full_name", f"{owner}/{repo}"),
        "description": data.get("description") or "",
        "stars": data.get("stargazers_count", 0),
        "language": data.get("language") or "Unknown",
        "topics": data.get("topics", [])[:8],
        "homepage": data.get("homepage") or "",
        "url": data.get("html_url", f"https://github.com/{owner}/{repo}"),
        "stars_today": data.get("stargazers_count", 0),  # trending doesn't give daily stars
        "license": data.get("license", {}).get("name", "") if isinstance(data.get("license"), dict) else "",
        "open_issues": data.get("open_issues_count", 0),
        "forks": data.get("forks_count", 0),
    }


def enrich_repos_batch(repo_names, progress_label=""):
    """Enrich multiple repos with rate-limit awareness. Returns dict of enriched data."""
    results = {}
    count = 0
    for full_name in repo_names:
        if count >= MAX_GITHUB_API_REQS:
            log(f"Reached max GitHub API requests ({MAX_GITHUB_API_REQS}). Stopping enrichment.", "⚠️")
            break
        if '/' not in full_name:
            continue
        log(f"  {progress_label} Enriching: {full_name}", "🔍")
        enriched = enrich_repo(*full_name.split('/', 1))
        if enriched:
            results[full_name] = enriched
        count += 1
        time.sleep(GITHUB_API_DELAY)  # ~2 req/sec, well within 5000/hr limit
    return results


# ─── RSS Parsers ──────────────────────────────────────────────────────────────

def fetch_github_trending_api():
    """Fetch trending repos via GitHub Search API (repos created this week, sorted by stars)."""
    entries = []
    # Search for repos created in the last 48h, sorted by most stars
    since = (datetime.now(timezone.utc) - timedelta(hours=48)).strftime('%Y-%m-%d')
    path = f"/search/repositories?q=created:>{since}+stars:>10&sort=stars&order=desc&per_page=25"
    data = github_api_get(path)
    if not data or 'items' not in data:
        log("  GitHub Search API returned no results", "⚠️")
        return entries
    for item in data['items'][:25]:
        full_name = item.get('full_name', '')
        owner = item.get('owner', {}).get('login', '')
        repo_name = item.get('name', '')
        entries.append({
            "id": entry_id(full_name),
            "owner": owner,
            "repo": repo_name,
            "full_name": full_name,
            "title": full_name,
            "link": item.get('html_url', f'https://github.com/{full_name}'),
            "published": item.get('created_at', ''),
            "source": "github_trending",
            "summary": f"New trending repo: {(item.get('description') or '')[:200]}",
            "github_repos": [full_name],
        })
    return entries


def parse_rss_entries(data, source_name, ns=None):
    """Generic RSS/Atom parser. Returns list of entries."""
    entries = []
    try:
        root = ET.fromstring(data)
    except ET.ParseError:
        return entries

    if ns is None:
        ns = {}

    for item in root.findall(".//item") + root.findall(".//{http://www.w3.org/2005/Atom}entry"):
        title_el = item.find("title") or item.find("{http://www.w3.org/2005/Atom}title")
        link_el = item.find("link") or item.find("{http://www.w3.org/2005/Atom}link")
        pub_el = item.find("pubDate") or item.find("{http://www.w3.org/2005/Atom}updated") or item.find("{http://www.w3.org/2005/Atom}published")
        desc_el = item.find("description") or item.find("{http://www.w3.org/2005/Atom}summary")
        content_el = item.find("{http://purl.org/rss/1.0/modules/content/}encoded")

        title = title_el.text if title_el is not None else "Untitled"
        link = ""
        if link_el is not None:
            link = link_el.text if link_el.text else link_el.get("href", "")
        pub_str = pub_el.text if pub_el is not None else ""
        desc = desc_el.text if desc_el is not None else ""
        content = content_el.text if content_el is not None else desc

        pub_date = parse_iso_date(pub_str)

        # Extract GitHub repos from content
        all_text = f"{title} {desc} {content}"
        github_repos = extract_github_repos(all_text)

        # Extract YouTube ID
        yt_id = extract_youtube_id(all_text)

        entry = {
            "id": entry_id(link or title),
            "title": strip_html(title),
            "link": link,
            "published": pub_date.isoformat() if pub_date else None,
            "source": source_name,
            "summary": strip_html(desc)[:500] if desc else "",
            "github_repos": github_repos,
            "youtube_id": yt_id,
        }
        entries.append(entry)

    return entries


def parse_youtube_rss(data):
    """Parse YouTube channel RSS. Returns list of video entries."""
    entries = []
    try:
        root = ET.fromstring(data)
    except ET.ParseError:
        return entries

    ns = {
        "atom": "http://www.w3.org/2005/Atom",
        "yt": "http://www.youtube.com/xml/schemas/2015",
        "media": "http://search.yahoo.com/mrss/",
    }

    for entry_el in root.findall(".//atom:entry", ns):
        title_el = entry_el.find("atom:title", ns)
        pub_el = entry_el.find("atom:published", ns)
        link_el = entry_el.find("atom:link", ns)
        desc_el = entry_el.find("media:group/media:description", ns)

        title = title_el.text if title_el is not None else "Untitled"
        pub_str = pub_el.text if pub_el is not None else ""
        link = link_el.get("href", "") if link_el is not None else ""
        desc = desc_el.text if desc_el is not None else ""

        pub_date = parse_iso_date(pub_str)
        if not is_recent(pub_date):
            continue

        yt_id = None
        if "v=" in link:
            yt_id = link.split("v=")[-1].split("&")[0]
        else:
            yt_id = extract_youtube_id(link)

        github_repos = extract_github_repos(desc)

        entries.append({
            "id": entry_id(yt_id or link),
            "title": title,
            "link": link,
            "youtube_id": yt_id,
            "youtube_url": link,
            "published": pub_date.isoformat() if pub_date else pub_str,
            "source": "youtube",
            "summary": strip_html(desc)[:500] if desc else "",
            "github_repos": github_repos,
        })

    return entries


# ─── Dedup ────────────────────────────────────────────────────────────────────

def load_dedup():
    if os.path.exists(DEDUP_FILE):
        with open(DEDUP_FILE, "r") as f:
            data = json.load(f)
            return set(data.get("published_ids", [])), set(data.get("published_repos", [])), data
    return set(), set(), {"published_ids": [], "published_repos": [], "last_run": None}


def save_dedup(published_ids, published_repos, extra_metadata=None):
    data = {
        "published_ids": sorted(list(published_ids))[-1000:],
        "published_repos": sorted(list(published_repos))[-1000:],
        "last_run": datetime.now(timezone.utc).isoformat(),
    }
    if extra_metadata:
        for k, v in extra_metadata.items():
            if k not in data:
                data[k] = v
    with open(DEDUP_FILE, "w") as f:
        json.dump(data, f, indent=2)


# ─── MiniMax AI ───────────────────────────────────────────────────────────────

def generate_tldr_minimax(items):
    """Batch-generate TLDRs using MiniMax API via HTTP. items is a list of dicts with 'title', 'description', 'source'."""
    if not items or not MINIMAX_API_KEY:
        return [{"tldr": item.get("description", "")[:200], "why_it_matters": "See project for details."} for item in items]

    prompt_parts = []
    for i, item in enumerate(items):
        prompt_parts.append(f"""Item {i+1}:
Title: {item.get('title', '')}
Description: {item.get('description', '')}
Source: {item.get('source', '')}
Stars: {item.get('stars', 'N/A')}
Language: {item.get('language', 'N/A')}
Topics: {', '.join(item.get('topics', []))}
""")

    prompt = f"""You are a developer advocate summarizing GitHub projects. For each project below, generate:
1. A TLDR (2-3 sentences, plain English, what it does and why you'd care)
2. "Why it matters" (1-2 sentences on significance/relevance)

Format for each item:
### [Original Title]
**TLDR:** ...
**Why it matters:** ...

---
{chr(10).join(prompt_parts)}
"""

    try:
        import urllib.request, urllib.error
        req_data = {
            "model": "minimax-m2.7",
            "messages": [
                {"role": "system", "content": "You are a helpful developer advocate. Be concise, specific, and technical."},
                {"role": "user", "content": prompt},
            ],
            "max_tokens": 2000,
            "temperature": 0.7,
        }
        req = urllib.request.Request(
            f"{MINIMAX_BASE_URL}/chat/completions",
            data=json.dumps(req_data).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {MINIMAX_API_KEY}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=120) as resp:
            resp_data = json.loads(resp.read().decode("utf-8"))
        text = resp_data["choices"][0]["message"]["content"]

        # Parse results - extract sections between "###" headers
        sections = re.split(r'\n(?=### )', text)
        results = {}
        for section in sections:
            if section.startswith("### "):
                lines = section.split("\n")
                title = lines[0].replace("### ", "").strip()
                tldr = ""
                why = ""
                for line in lines[1:]:
                    if line.startswith("**TLDR:**"):
                        tldr = line.replace("**TLDR:**", "").strip()
                    elif line.startswith("**Why it matters:**"):
                        why = line.replace("**Why it matters:**", "").strip()
                results[title] = {"tldr": tldr, "why_it_matters": why}

        # Map back to items
        outputs = []
        for item in items:
            title_key = item.get("title", "")
            # Try exact match, then partial
            match = results.get(title_key)
            if not match:
                for k, v in results.items():
                    if title_key.lower() in k.lower() or k.lower() in title_key.lower():
                        match = v
                        break
            outputs.append(match or {"tldr": item.get("description", "")[:200], "why_it_matters": "See project for details."})
        return outputs
    except Exception as e:
        log(f"MiniMax API error: {e}. Using fallback summaries.", "⚠️")
        return [{"tldr": item.get("description", "")[:200], "why_it_matters": "See project for details."} for item in items]


# ─── Ranking ──────────────────────────────────────────────────────────────────

def rank_projects(projects):
    """
    Rank projects by: stars (40%) + recency (30%) + homelab/AI/coding relevance (30%).
    Returns sorted list.
    """
    now = datetime.now(timezone.utc)

    def score(p):
        # Stars score (normalized, log scale)
        stars = p.get("stars", 0)
        star_score = min(40, (stars ** 0.3) * 5)

        # Recency score
        pub = p.get("published")
        if pub:
            try:
                pub_dt = datetime.fromisoformat(pub.replace('Z', '+00:00'))
                age_hours = max(0, (now - pub_dt).total_seconds() / 3600)
                recency_score = max(20, 30 - age_hours / 4)  # Decays over 120 hours
            except Exception:
                recency_score = 15
        else:
            recency_score = 15

        # Relevance score
        text = f"{p.get('title', '')} {p.get('description', '')} {' '.join(p.get('topics', []))}".lower()
        relevance = 0
        homelab_kw = ["homelab", "selfhosted", "self-hosted", "raspberry", "pi", "nas", "server", "docker", "container", "kubernetes", "k8s", "homelab"]
        ai_kw = ["ai", "llm", "gpt", "claude", "openai", "machine learning", "neural", "langchain", "rag", "embedding", "inference", "ollama", "textgen"]
        coding_kw = ["cli", "tool", "api", "library", "framework", "sdk", "terminal", "developer", "devops", "automation"]
        for kw in homelab_kw:
            if kw in text: relevance += 3
        for kw in ai_kw:
            if kw in text: relevance += 3
        for kw in coding_kw:
            if kw in text: relevance += 1
        relevance_score = min(30, relevance)

        return star_score * 0.4 + recency_score * 0.3 + relevance_score * 0.3

    scored = [(p, score(p)) for p in projects]
    scored.sort(key=lambda x: x[1], reverse=True)
    return [p for p, _ in scored]


# ─── Article Builder ───────────────────────────────────────────────────────────

def build_article(projects, videos, tldr_results):
    """Build markdown article from projects and videos."""
    today = datetime.now(timezone.utc).strftime("%B %d, %Y")
    date_slug = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    sections = []

    # Header
    sections.append(f"# GitHub Awesome Daily - {today}\n")
    sections.append(f"*Curated GitHub projects and AI videos for developers.*\n")
    sections.append(f"📅 *Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}*\n")
    sections.append("---\n\n")

    # ── GitHub Projects ──────────────────────────────────────────────────────
    sections.append("## 🔥 GitHub Projects\n")
    sections.append(f"*Ranked by stars, recency, and relevance to homelab/AI/coding.*\n\n")

    if not projects:
        sections.append("*No projects found in this cycle.*\n\n")
    else:
        for i, proj in enumerate(projects[:15], 1):
            full_name = proj.get("full_name", "")
            url = proj.get("url", f"https://github.com/{full_name}")
            stars = proj.get("stars", 0)
            language = proj.get("language", "Unknown")
            topics = proj.get("topics", [])[:6]
            desc = proj.get("description", "")
            homepage = proj.get("homepage", "")

            # Get TLDR result
            tldr_data = {}
            for t in tldr_results:
                if full_name.lower() in t.get("title", "").lower() or t.get("title", "").lower() in full_name.lower():
                    tldr_data = t
                    break
            if not tldr_data and tldr_results:
                tldr_data = tldr_results[min(i-1, len(tldr_results)-1)]
            tldr = tldr_data.get("tldr", desc[:200]) if tldr_data else desc[:200]
            why = tldr_data.get("why_it_matters", "") if tldr_data else ""

            section = f"### {i}. [{full_name}]({url})\n\n"
            section += f"<div style='display:flex;gap:8px;align-items:center;flex-wrap:wrap'>\n"
            section += f"<span>⭐ {stars:,} stars</span> · "
            section += f"<span>💻 {language}</span>"
            if topics:
                section += f" · <span>{' '.join(f'`{t}`' for t in topics[:4])}</span>\n"
            section += f"</div>\n\n"
            if desc:
                section += f"**Description:** {desc}\n\n"
            section += f"**TLDR:** {tldr}\n\n"
            if why:
                section += f"**Why it matters:** {why}\n\n"
            # Build structured entity data for LinkEntry
            entity_data = {
                "entity_type": "github_project",
                "title": full_name,
                "url": url,
                "description": desc or tldr,
                "stars": stars,
                "language": language,
                "tags": topics + ["github", "open-source"],
                "category": "github",
            }
            entity_json = json.dumps(entity_data, ensure_ascii=False)

            section += f"[🔗 View on GitHub]({url})"
            if homepage:
                section += f" · [🌐 Homepage]({homepage})"
            section += f"\n\n<!-- LINKENTRY_JSON:{entity_json} -->\n\n"

            sections.append(section)

    # ── AI Videos ─────────────────────────────────────────────────────────────
    sections.append("---\n\n")
    sections.append("## 📺 AI & Developer Videos\n")
    sections.append(f"*Latest from GitHubAwesome YouTube channel.*\n\n")

    if not videos:
        sections.append("*No videos found in this cycle.*\n\n")
    else:
        for i, vid in enumerate(videos[:8], 1):
            title = vid.get("title", "Untitled")
            link = vid.get("youtube_url", vid.get("link", ""))
            yt_id = vid.get("youtube_id", "")
            desc = vid.get("summary", "")
            repos = vid.get("github_repos", [])

            section = f"### {i}. [{title}]({link})\n\n"
            if desc:
                section += f"{desc[:300]}{'...' if len(desc) > 300 else ''}\n\n"
            if repos:
                section += f"**Repos mentioned:** "
                section += " · ".join([f"[{r}](https://github.com/{r})" for r in repos[:5]])
                section += "\n\n"
            section += f"[▶️ Watch on YouTube]({link})\n\n"
            sections.append(section)

    # ── All Repos ─────────────────────────────────────────────────────────────
    all_repos = set(p.get("full_name", "") for p in projects if p.get("full_name"))
    for vid in videos:
        for r in vid.get("github_repos", []):
            all_repos.add(r)

    if all_repos:
        sections.append("---\n\n")
        sections.append("## 📦 All Repositories\n\n")
        for repo in sorted(all_repos):
            sections.append(f"- [{repo}](https://github.com/{repo})\n")
        sections.append("\n")

    # Footer
    sections.append("---\n\n")
    sections.append(f"*Sources: GitHub Trending · GitHubAwesome · Hacker News · Lobsters · Reddit r/Programming · YouTube*\n")
    sections.append(f"*Generated by Nomi Vale · {date_slug}*\n")

    title = f"GitHub Awesome Daily - {today}"
    content = "".join(sections)

    # Extract tags
    all_topics = set()
    for p in projects:
        all_topics.update(p.get("topics", []))
    tags = ["github-awesome", "daily-brief", "open-source", "trending"]
    for t in all_topics:
        if len(tags) < 15:
            tags.append(t)

    return title, content, list(tags)[:15]


# ─── Publish ──────────────────────────────────────────────────────────────────

def extract_entries_from_content(content):
    """Extract LinkEntry JSON objects from <!-- LINKENTRY_JSON:{...} --> comments in article content."""
    entries = []
    pattern = r'<!-- LINKENTRY_JSON:({.*?}) -->(?:\n|$)'
    for match in re.finditer(pattern, content, re.DOTALL):
        try:
            entry = json.loads(match.group(1))
            entries.append(entry)
        except json.JSONDecodeError:
            pass
    return entries


def publish_to_nomi_brief(title, content, tags, category="GitHub & Open Source", entries=None):
    structured_entries = entries if entries is not None else extract_entries_from_content(content)

    payload = {
        "type": "article",
        "payload": {
            "title": title,
            "content": content,
            "category": category,
            "tags": tags,
            "source": "github-awesome",
            "authorName": "Nomi Vale",
            "entries": structured_entries,
        }
    }

    payload_json = json.dumps(payload)
    cmd = [
        "curl", "-s", "-X", "POST", WEBHOOK_URL,
        "-H", "Content-Type: application/json",
        "-H", f"Authorization: Bearer {WEBHOOK_SECRET}",
        "-d", payload_json,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    if result.returncode == 0:
        try:
            resp = json.loads(result.stdout)
            if resp.get("success"):
                log(f"Published: {resp.get('articleId', 'unknown')}", "✅")
                return True, resp.get("articleId")
            else:
                log(f"Webhook error: {resp}", "❌")
                return False, None
        except json.JSONDecodeError:
            log(f"Bad webhook response: {result.stdout[:200]}", "❌")
            return False, None
    else:
        log(f"curl failed: {result.stderr[:200]}", "❌")
        return False, None


def save_to_linkentry(project, article_id=None):
    """Save a GitHub project as a LinkEntry to Nomi Brief."""
    url = project.get("url", "") or project.get("html_url", "")
    if not url:
        return False, None

    payload = {
        "title": project.get("full_name", "") or project.get("name", "Untitled"),
        "url": url,
        "description": project.get("description", "")[:500],
        "image": project.get("image", ""),
        "tags": project.get("topics", []) + ["github", "open-source", "github-awesome"],
        "category": "github",
        "source": "GitHub",
        "sourceUrl": url,
    }
    if article_id:
        payload["articleId"] = article_id

    payload_json = json.dumps(payload)
    # Use -w to capture HTTP status code, -f to fail on HTTP errors
    cmd = [
        "curl", "-s", "-w", "%{http_code}", "-f", "-X", "POST", LINKENTRY_API_URL,
        "-H", "Content-Type: application/json",
        "-H", f"Authorization: Bearer {LINKENTRY_API_SECRET}",
        "-d", payload_json,
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        if result.returncode != 0:
            log(f"LinkEntry HTTP error ({result.returncode}): {project.get('full_name', '')[:40]}", "⚠️")
            return False, None
        stdout = result.stdout
        if len(stdout) >= 3:
            http_code = stdout[-3:]
            body = stdout[:-3]
            if http_code not in ("200", "201"):
                log(f"LinkEntry HTTP {http_code}: {project.get('full_name', '')[:40]}", "⚠️")
                return False, None
            try:
                resp = json.loads(body)
                link_id = resp.get("data", {}).get("id") or resp.get("id")
                if link_id:
                    log(f"LinkEntry saved: {project.get('full_name', '')[:40]}...", "✅")
                    return True, link_id
            except json.JSONDecodeError:
                pass
    except Exception as e:
        log(f"LinkEntry error: {e}", "⚠️")

    return False, None
    except Exception as e:
        log(f"LinkEntry error: {e}", "⚠️")

    return False, None


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    log(f"🚀 GitHub Awesome Daily Brief - {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}\n")

    # Initialize database if available
    if DB_AVAILABLE:
        try:
            init_db()
            log("📦 Knowledge database initialized", "📦")
        except Exception as e:
            log(f"⚠️ Database init failed: {e}", "⚠️")

    # Load dedup
    published_ids, published_repos, dedup_data = load_dedup()
    log(f"📋 Dedup: {len(published_ids)} entries, {len(published_repos)} repos tracked\n")

    # ── Fetch RSS Sources ──────────────────────────────────────────────────
    all_entries = []

    # 1. GitHub Trending (via Search API)
    log("📡 Fetching GitHub Trending (Search API)...", "🔮")
    try:
        entries = fetch_github_trending_api()
        log(f"  Found {len(entries)} trending repos", "🔮")
        all_entries.extend(entries)
    except Exception as e:
        log(f"  Failed: {e}", "⚠️")

    # 2. GitHubAwesome RSS
    log("📡 Fetching GitHubAwesome RSS...", "📡")
    try:
        data = fetch_url(RSS_SOURCES["github_awesome"])
        entries = parse_rss_entries(data, "githubawesome")
        log(f"  Found {len(entries)} entries", "📡")
        all_entries.extend(entries)
    except Exception as e:
        log(f"  Failed: {e}", "⚠️")

    # 3. Hacker News
    log("📡 Fetching Hacker News...", "📰")
    try:
        data = fetch_url(RSS_SOURCES["hacker_news"])
        entries = parse_rss_entries(data, "hackernews")
        log(f"  Found {len(entries)} entries", "📰")
        all_entries.extend(entries)
    except Exception as e:
        log(f"  Failed: {e}", "⚠️")

    # 4. Lobsters
    log("📡 Fetching Lobsters...", "🦞")
    try:
        data = fetch_url(RSS_SOURCES["lobsters"])
        entries = parse_rss_entries(data, "lobsters")
        log(f"  Found {len(entries)} entries", "🦞")
        all_entries.extend(entries)
    except Exception as e:
        log(f"  Failed: {e}", "⚠️")

    # 5. Reddit r/Programming
    log("📡 Fetching Reddit r/Programming...", "🔴")
    try:
        data = fetch_url(RSS_SOURCES["reddit_programming"])
        entries = parse_rss_entries(data, "reddit")
        log(f"  Found {len(entries)} entries", "🔴")
        all_entries.extend(entries)
    except Exception as e:
        log(f"  Failed: {e}", "⚠️")

    # 6. YouTube
    log("📡 Fetching YouTube channel RSS...", "📺")
    try:
        data = fetch_url(YOUTUBE_RSS)
        yt_entries = parse_youtube_rss(data)
        log(f"  Found {len(yt_entries)} recent videos", "📺")
    except Exception as e:
        log(f"  Failed: {e}", "⚠️")
        yt_entries = []

    # ── Filter Entries ──────────────────────────────────────────────────────

    # Collect unique GitHub repos from all sources
    repo_names = set()
    for entry in all_entries:
        if entry.get("source") == "github_trending":
            repo_names.add(entry.get("full_name", ""))
        for repo in entry.get("github_repos", []):
            repo_names.add(repo)

    # Remove already-published repos (dedup)
    new_repo_names = [r for r in repo_names if r and r not in published_repos]
    log(f"\n📊 {len(repo_names)} unique repos found, {len(new_repo_names)} new\n")

    if not new_repo_names and not yt_entries:
        log("Nothing new to publish. Exiting.", "✅")
        return

    # ── Enrich Repos via GitHub API ─────────────────────────────────────────
    repos_to_enrich = new_repo_names[:MAX_ENTRIES]
    enriched = {}

    if repos_to_enrich:
        log(f"🔧 Enriching {len(repos_to_enrich)} repos via GitHub API...\n", "🔧")
        enriched = enrich_repos_batch(repos_to_enrich, progress_label="🔧")
        log(f"  Enriched {len(enriched)} repos", "✅")

    # ── Build projects list ─────────────────────────────────────────────────
    projects = []
    seen_full_names = set()

    # Priority: enriched repos from GitHubTrending
    for entry in all_entries:
        if entry.get("source") == "github_trending":
            fn = entry.get("full_name", "")
            if fn in enriched:
                proj = enriched[fn].copy()
                proj["published"] = entry.get("published")
                proj["link"] = entry.get("link")
                if fn not in seen_full_names:
                    projects.append(proj)
                    seen_full_names.add(fn)

    # Add other enriched repos mentioned in other sources
    for fn, data in enriched.items():
        if fn not in seen_full_names:
            proj = data.copy()
            projects.append(proj)
            seen_full_names.add(fn)

    # Rank projects
    if projects:
        projects = rank_projects(projects)

    # ── Generate TLDRs via MiniMax ───────────────────────────────────────────
    tldr_items = []
    for p in projects[:15]:
        tldr_items.append({
            "title": p.get("full_name", ""),
            "description": p.get("description", ""),
            "source": "GitHub",
            "stars": p.get("stars", 0),
            "language": p.get("language", ""),
            "topics": p.get("topics", []),
        })

    tldr_results = []
    if tldr_items and MINIMAX_API_KEY:
        log(f"\n🤖 Generating TLDRs for {len(tldr_items)} projects via MiniMax...", "🤖")
        # Batch in groups of MINIMAX_BATCH_SIZE
        for i in range(0, len(tldr_items), MINIMAX_BATCH_SIZE):
            batch = tldr_items[i:i+MINIMAX_BATCH_SIZE]
            try:
                results = generate_tldr_minimax(batch)
                tldr_results.extend(results)
                log(f"  Batch {i//MINIMAX_BATCH_SIZE + 1}: {len(results)} TLDRs generated", "✅")
            except Exception as e:
                log(f"  MiniMax batch error: {e}. Using fallbacks.", "⚠️")
                tldr_results.extend([{"tldr": b.get("description", "")[:200], "why_it_matters": ""} for b in batch])
    else:
        # Fallback
        tldr_results = [{"tldr": p.get("description", "")[:200], "why_it_matters": ""} for p in projects[:15]]

    # ── Build Article ────────────────────────────────────────────────────────
    title, content, tags = build_article(projects, yt_entries, tldr_results)
    log(f"\n📝 Article: \"{title}\" ({len(content)} chars)", "📝")

    # ── Publish ─────────────────────────────────────────────────────────────
    success, article_id = publish_to_nomi_brief(title, content, tags)

    if success:
        # Update dedup
        for entry in all_entries:
            published_ids.add(entry["id"])
        for fn in seen_full_names:
            published_repos.add(fn)
        save_dedup(published_ids, published_repos, {"last_article_id": article_id})
        
        # Insert GitHub projects and articles into database
        if DB_AVAILABLE:
            try:
                # Insert GitHub projects
                for i, proj in enumerate(projects):
                    owner = proj.get("full_name", "").split("/")[0] if "/" in proj.get("full_name", "") else ""
                    repo = proj.get("full_name", "").split("/")[1] if "/" in proj.get("full_name", "") else proj.get("full_name", "")
                    tldr_data = tldr_results[i] if i < len(tldr_results) else {}
                    
                    project_dict = {
                        "name": proj.get("name", repo),
                        "owner": owner,
                        "repo": repo,
                        "description": proj.get("description"),
                        "url": proj.get("html_url") or f"https://github.com/{proj.get('full_name')}",
                        "stars": proj.get("stars", 0),
                        "language": proj.get("language"),
                        "topics": proj.get("topics", []),
                        "homelab_relevance": "medium",  # Would need AI assessment
                        "monetization_potential": "low",
                        "tl_dr": tldr_data.get("tldr", ""),
                        "why_it_matters": tldr_data.get("why_it_matters", ""),
                    }
                    insert_github_project(project_dict)
                
                # Insert article
                article_dict = {
                    "title": title,
                    "url": f"https://brief.unschackle.com/article/{article_id}",
                    "summary": f"Daily GitHub Awesome brief with {len(projects)} projects and {len(yt_entries)} videos",
                    "content": content,
                    "source": "github-awesome",
                    "category": "technical",
                    "keywords": tags,
                    "published_at": datetime.now(timezone.utc).isoformat(),
                    "score": 5,
                }
                insert_article(article_dict)
                log(f"   DB: Inserted {len(projects)} projects and 1 article", "💾")
            except Exception as e:
                log(f"   DB insert warning: {e}", "⚠️")
        
        # Save LinkEntries to Nomi Brief for each project
        log(f"\n📎 Saving LinkEntries to Nomi Brief...", "📎")
        linkentry_count = 0
        for proj in projects[:15]:
            success_le, le_id = save_to_linkentry(proj, article_id)
            if success_le:
                linkentry_count += 1
        
        log(f"   LinkEntries saved: {linkentry_count}/{min(len(projects), 15)}", "📎")
        log(f"\n✅ Done! Published article {article_id}", "✅")
        log(f"   Projects: {len(projects)}, Videos: {len(yt_entries)}", "📊")
        log(f"   Dedup: {len(published_repos)} repos tracked", "📋")
    else:
        log("\n❌ Publish failed. Dedup NOT updated.", "❌")
        sys.exit(1)


if __name__ == "__main__":
    main()
