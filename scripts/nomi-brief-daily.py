#!/usr/bin/env python3
"""
Daily AI News Brief → Nomi Brief (Rebuilt)
Fetches from 25+ diverse AI/tech RSS feeds, generates AI TLDRs,
categorizes into 4 focused briefs, and publishes to Nomi Brief LinkEntry API.
"""

import json
import os
import sys
import re
import subprocess
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
import urllib.request
import urllib.error
from collections import Counter
from typing import Optional

# Database integration
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    from db_helper import init_db, article_exists, insert_article, mark_article_favorite
    DB_AVAILABLE = True
except ImportError:
    DB_AVAILABLE = False
    print("⚠️ db_helper not available, running without database")
import time

# --- Config ---
WEBHOOK_URL = "https://brief.unschackle.com/api/webhook"
WEBHOOK_SECRET = os.environ.get("NOMI_BRIEF_WEBHOOK_SECRET", "")
LINKENTRY_API_URL = "https://brief.unschackle.com/api/links"
LINKENTRY_API_SECRET = os.environ.get("NOMI_BRIEF_WEBHOOK_SECRET", "")
MINIMAX_API_KEY = os.environ.get("MINIMAX_API_KEY", "")
MINIMAX_BASE_URL = "https://api.minimax.io/v1"
DEDUP_FILE = os.path.expanduser("~/.nomi-brief-news-dedup.json")
MAX_AGE_HOURS = 48
MAX_ENTRIES_PER_CATEGORY = 30
BATCH_SIZE = 10  # TLDR generation batch size

# --- RSS Feeds (25+ diverse sources) ---
RSS_FEEDS = [
    # Google News AI
    ("Google News AI", "https://news.google.com/rss/search?q=AI+LLM+GPT+model&hl=en-US&gl=US&ceid=US:en"),

    # AI/ML Reddit communities
    ("Reddit r/MachineLearning", "https://www.reddit.com/r/MachineLearning/.rss"),
    ("Reddit r/Artificial", "https://www.reddit.com/r/Artificial/.rss"),
    ("Reddit r/singularity", "https://www.reddit.com/r/singularity/.rss"),
    ("Reddit r/ChatGPT", "https://www.reddit.com/r/ChatGPT/.rss"),

    # Tech news aggregators
    ("Hacker News AI", "https://hnrss.org/newest?q=AI%20OR%20machine%20learning%20OR%20GPT%20OR%20LLM"),
    ("Lobsters", "https://lobste.rs/rss"),

    # GitHub
    ("GitHub Trending", "https://github.com/trending.atom"),

    # Academic/Research
    ("arXiv cs.CL (NLP)", "http://export.arxiv.org/rss/cs.CL"),
    ("arXiv cs.CV (Vision)", "http://export.arxiv.org/rss/cs.CV"),

    # AI Labs & Companies
    ("Hugging Face Blog", "https://huggingface.co/blog/feed.xml"),
    ("OpenAI News", "https://news.google.com/rss/search?q=OpenAI+ChatGPT&hl=en-US&gl=US&ceid=US:en"),
    ("Google DeepMind Blog", "https://blog.google/technology/ai/rss/"),
    ("Anthropic News", "https://news.google.com/rss/search?q=Anthropic+Claude&hl=en-US&gl=US&ceid=US:en"),
    ("NVIDIA Blog", "https://blogs.nvidia.com/feed/"),
    ("Microsoft AI Blog", "https://news.google.com/rss/search?q=Microsoft+AI+Copilot&hl=en-US&gl=US&ceid=US:en"),
    ("Meta AI", "https://news.google.com/rss/search?q=Meta+AI+Llama&hl=en-US&gl=US&ceid=US:en"),

    # Tech news
    ("TechCrunch AI", "https://techcrunch.com/category/artificial-intelligence/feed/"),
    ("VentureBeat AI", "https://venturebeat.com/category/ai/feed/"),
    ("The Verge AI", "https://www.theverge.com/rss/index.xml"),
    ("Wired AI", "https://www.wired.com/feed/rss"),
    ("Ars Technica AI", "https://feeds.arstechnica.com/arstechnica/index"),

    # AI-specific publications
    ("MIT Tech Review", "https://www.technologyreview.com/feed/"),
    ("Analytics Vidhya", "https://analyticsvidhya.com/feed/"),
    ("AI Insider", "https://news.google.com/rss/search?q=AI+Insider&hl=en-US&gl=US&ceid=US:en"),
    ("Silicon Angle", "https://siliconangle.com/feed/"),
    ("Tech.eu AI", "https://tech.eu/feed/"),
    ("The Batch (Andrew Ng)", "https://news.google.com/rss/search?q=The+Batch+Andrew+Ng+AI&hl=en-US&gl=US&ceid=US:en"),
    ("AI News", "https://news.google.com/rss/search?q=artificial+intelligence+news&hl=en-US&gl=US&ceid=US:en"),
    ("AI Weekly", "https://news.google.com/rss/search?q=AI+weekly+newsletter&hl=en-US&gl=US&ceid=US:en"),
]

# --- Categories ---
CATEGORIES = {
    "industry": {
        "name": "🏭 Industry Brief",
        "description": "Company/product launches, funding, partnerships, and market moves",
        "tags": ["industry", "business", "startups", "funding", "partnerships"],
        "keywords": ["launch", "announce", "release", "funding", "investment", "partnership",
                     "acquisition", "ipo", "valuation", "startup", "company", "product",
                     "ceo", "ceo says", "deal", "raises", "series", "million", "billion"],
    },
    "technical": {
        "name": "⚙️ Technical Brief",
        "description": "Research papers, model releases, benchmarks, and code",
        "tags": ["technical", "research", "models", "open-source", "code", "benchmarks"],
        "keywords": ["model", "llm", "gpt-", "gemini", "claude", "llama", "mistral", "benchmark",
                     "code", "github.com/", "dataset", "training", "inference",
                     "architecture", "weights", "fine-tun", "rag", "embedding", "arxiv",
                     "paper", "research", "algorithm", "neural", "token", "batch",
                     "pipeline", "framework", "library", "sdk", "api", "open source",
                     "agent", "plugin", "extension", "runtime", "compiler"],
    },
    "safety": {
        "name": "🛡️ Safety & Policy Brief",
        "description": "AI regulation, governance, safety research, and ethics",
        "tags": ["safety", "policy", "regulation", "governance", "ethics", "compliance"],
        "keywords": ["safety", "regulation", "policy", "governance", "ethics", "compliance",
                     "government", "law", "act", "eu ai act", "fda", "fcc", "congress",
                     "jailbreak", "prompt injection", "alignment", "bias", "fairness",
                     "privacy", "data", "security", "harm", "risk", "threat"],
    },
    "academic": {
        "name": "🎓 Academic Brief",
        "description": "arXiv papers, research breakthroughs, and scientific discoveries",
        "tags": ["academic", "research", "arXiv", "paper", "science", "breakthrough"],
        "keywords": ["arxiv", "paper", "research", "study", "academic", "university",
                     "scientist", "professor", "phd", " preprint", "findings", "breakthrough",
                     "discovery", "experiment", "results", "published", "journal"],
    },
}

# --- Helpers ---

def fetch_url(url, timeout=15):
    """Fetch a URL and return the response body as string."""
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; NomiBrief/2.0; +https://unschackle.com)",
        "Accept": "application/rss+xml, application/xml, text/xml, application/atom+xml, */*",
    }
    req = Request(url, headers=headers)
    try:
        with urlopen(req, timeout=timeout) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except HTTPError as e:
        if e.code == 406:  # GitHub trending.atom not available via HTTP
            # Try HTTPS alternative
            if "github.com" in url and "/trending" in url:
                return ""
        print(f"  ⚠️ HTTP {e.code}: {url}")
        return ""
    except Exception as e:
        # Try HTTP fallback for arXiv redirects
        if url.startswith("https://arxiv.org"):
            http_url = url.replace("https://", "http://")
            req = Request(http_url, headers=headers)
            try:
                with urlopen(req, timeout=timeout) as resp:
                    return resp.read().decode("utf-8", errors="replace")
            except Exception:
                pass
        # Lobsters moved to a new domain
        if "lobste.rs" in url:
            return ""
        print(f"  ⚠️ Fetch failed: {e}")
        return ""
        return ""


def parse_iso_date(date_str):
    """Parse various date formats into a datetime."""
    if not date_str:
        return None
    date_str = date_str.strip()
    for fmt in [
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S.%fZ",
        "%Y-%m-%dT%H:%M:%S.%f%z",
        "%a, %d %b %Y %H:%M:%S %z",
        "%a, %d %b %Y %H:%M:%S GMT",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
    ]:
        try:
            return datetime.strptime(date_str, fmt).replace(tzinfo=timezone.utc)
        except (ValueError, AttributeError):
            continue
    try:
        from email.utils import parsedate_to_datetime
        return parsedate_to_datetime(date_str)
    except Exception:
        return None


def is_recent(dt, max_age_hours=MAX_AGE_HOURS):
    """Check if a datetime is within the last N hours."""
    if dt is None:
        return False
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=max_age_hours)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt >= cutoff


def strip_html(text):
    """Basic HTML tag stripping."""
    if not text:
        return ""
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def detect_category(title, desc):
    """Detect which category an entry belongs to."""
    text = ((title or "") + " " + (desc or "")).lower()

    # Score each category
    scores = {cat: 0 for cat in CATEGORIES}

    for cat_key, cat_info in CATEGORIES.items():
        for kw in cat_info["keywords"]:
            if kw in text:
                scores[cat_key] += 1

    # Industry wins ties if it has any signal (funding/launch/product news is clearly industry)
    if scores["industry"] >= 1:
        return "industry"
    # Safety wins if it has any signal
    if scores["safety"] >= 1:
        return "safety"
    # Academic wins if it has any signal
    if scores["academic"] >= 1:
        return "academic"
    # Default to technical
    return "technical"


def score_entry(entry):
    """Score an entry by relevance/importance for ranking."""
    score = 0
    title = ((entry.get("title") or "") + " " + (entry.get("description") or "")).lower()

    # Major AI companies get boosts
    if any(k in title for k in ["openai", "anthropic", "google deepmind", "deepmind", "google ai"]):
        score += 5
    if any(k in title for k in ["microsoft", "meta", "nvidia", "amazon", "apple", "xai"]):
        score += 3
    if any(k in title for k in ["breaking", "launch", "release", "announce", "unveils", "debuts", "reveals"]):
        score += 3
    if any(k in title for k in ["agent", "reasoning", "frontier", "sota", "benchmark"]):
        score += 2
    if any(k in title for k in ["model", "llm", "gpt", "gemini", "claude", "mistral", "llama"]):
        score += 1
    if any(k in title for k in ["safety", "regulation", "policy", "governance", "eu ai act"]):
        score += 2
    if any(k in title for k in ["arxiv", "paper", "research", "study", "academic"]):
        score += 2
    if any(k in title for k in ["funding", "raises", "series", "million", "billion", "investment"]):
        score += 2

    # Bonus for recent posts
    if entry.get("_hours_ago", 999) < 6:
        score += 2

    return score


# --- Deduplication ---

def load_dedup():
    """Load dedup state from file."""
    try:
        with open(DEDUP_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {"published_urls": [], "published_ids": [], "last_cleanup": None}


def save_dedup(dedup):
    """Save dedup state to file."""
    try:
        with open(DEDUP_FILE, 'w') as f:
            json.dump(dedup, f, indent=2)
    except Exception as e:
        print(f"  ⚠️ Failed to save dedup file: {e}")


def is_duplicate(entry, dedup):
    """Check if an entry has already been published."""
    url = entry.get("link", "").strip()
    entry_id = entry.get("id", "").strip()
    title_lower = entry.get("title", "").lower().strip()

    # Check URL
    if url and url in dedup.get("published_urls", []):
        return True

    # Check ID
    if entry_id and entry_id in dedup.get("published_ids", []):
        return True

    # Check title similarity (exact match)
    for published_title in dedup.get("published_titles", []):
        if published_title.lower() == title_lower:
            return True

    # Check database if available
    if DB_AVAILABLE and url:
        if article_exists(url):
            return True

    return False


def mark_published(entry, dedup):
    """Mark an entry as published."""
    url = entry.get("link", "").strip()
    entry_id = entry.get("id", "").strip()
    title = entry.get("title", "").strip()

    if "published_urls" not in dedup:
        dedup["published_urls"] = []
    if "published_ids" not in dedup:
        dedup["published_ids"] = []
    if "published_titles" not in dedup:
        dedup["published_titles"] = []

    if url:
        dedup["published_urls"].append(url)
    if entry_id:
        dedup["published_ids"].append(entry_id)
    if title:
        dedup["published_titles"].append(title)

    # Keep only last 1000 entries
    for key in ["published_urls", "published_ids", "published_titles"]:
        if len(dedup[key]) > 1000:
            dedup[key] = dedup[key][-1000:]


# --- AI TLDR Generation ---

def generate_tldr_batch(stories, api_key, base_url=MINIMAX_BASE_URL, model="MiniMax-Text-01"):
    """Generate TLDRs for a batch of stories using minimax API via curl."""
    if not api_key:
        print("  ⚠️ No MINIMAX_API_KEY, using truncated descriptions as TLDRs")
        return {s["link"]: truncate_to_tldr(s.get("description", "")) for s in stories}

    if not stories:
        return {}

    # Build batch prompt - limit stories to avoid token limits
    stories = stories[:8]
    articles_text = ""
    for i, story in enumerate(stories):
        title = story.get("title", "Untitled")
        desc = story.get("description", "")[:300]
        articles_text += f"\n--- Article {i+1} ---\nTitle: {title}\nContent: {desc}\n"

    prompt = f"""You are a news summarizer. For each article below, write a 3-sentence TLDR summary.
The TLDR should: (1) state the main news, (2) explain why it matters, (3) mention the source or key player.
Format each as: [TLDR{i+1}] <3-sentence summary>

{articles_text}

Remember: exactly 3 sentences per TLDR. Be concise and informative."""

    payload = json.dumps({
        "model": model,
        "messages": [
            {"role": "system", "content": "You are a helpful news summarizer assistant."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 1200,
    })

    cmd = [
        "curl", "-s", "-X", "POST",
        f"{base_url}/chat/completions",
        "-H", "Content-Type: application/json",
        "-H", f"Authorization: Bearer {api_key}",
        "-d", payload,
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        if result.returncode == 0 and result.stdout:
            response_data = json.loads(result.stdout)
            content = response_data.get("choices", [{}])[0].get("message", {}).get("content", "")

            tldrs = {}
            for i, story in enumerate(stories):
                pattern = rf"\[TLDR{i+1}\]\s*(.+?)(?:\[TLDR|\Z)"
                match = re.search(pattern, content, re.DOTALL)
                if match:
                    tldrs[story["link"]] = match.group(1).strip()
                else:
                    tldrs[story["link"]] = truncate_to_tldr(story.get("description", ""))
            return tldrs
    except Exception as e:
        print(f"  ⚠️ TLDR generation error: {e}")

    return {s["link"]: truncate_to_tldr(s.get("description", "")) for s in stories}


def truncate_to_tldr(text):
    """Create a basic TLDR from description when AI fails."""
    if not text:
        return "No description available."
    # Take first 2 sentences or 200 chars
    sentences = re.split(r'(?<=[.!?])\s+', text)
    if len(sentences) >= 2:
        return ' '.join(sentences[:2])
    return text[:200] + ('...' if len(text) > 200 else '')


# --- Webhook Publishing ---

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


def publish_article(title, content, category, tags, source="Nomi Brief Daily", entries=None):
    """Publish an article to Nomi Brief via webhook with retry."""
    # Extract structured entries from the article content if not provided
    structured_entries = entries if entries is not None else extract_entries_from_content(content)

    payload = {
        "type": "article",
        "payload": {
            "title": title,
            "content": content,
            "category": category,
            "tags": tags,
            "source": source,
            "authorName": "Nomi Vale",
            "entries": structured_entries,
        }
    }

    payload_json = json.dumps(payload)

    for attempt in range(2):
        cmd = [
            "curl", "-s", "-X", "POST", WEBHOOK_URL,
            "-H", "Content-Type: application/json",
            "-H", f"Authorization: Bearer {WEBHOOK_SECRET}",
            "-d", payload_json,
        ]

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                try:
                    resp = json.loads(result.stdout)
                    if resp.get("success"):
                        print(f"  ✅ Published: {title[:50]}...")
                        return True, resp.get("articleId", "unknown")
                    else:
                        print(f"  ⚠️ Webhook error: {resp}")
                except json.JSONDecodeError:
                    if result.stdout.strip():
                        print(f"  ⚠️ Bad response: {result.stdout[:100]}")
            else:
                print(f"  ⚠️ curl failed: {result.stderr[:100]}")
        except subprocess.TimeoutExpired:
            print(f"  ⚠️ Timeout on attempt {attempt + 1}")
        except Exception as e:
            print(f"  ⚠️ Error: {e}")

        if attempt == 0:
            print(f"  ↻ Retrying...")
            time.sleep(1)

    return False, None


def save_to_linkentry(story, article_id=None, category="news"):
    """Save a story as a LinkEntry to Nomi Brief. Returns (success: bool, link_id: str)."""
    url = story.get("link", "")
    if not url:
        return False, None

    payload = {
        "title": story.get("title", ""),
        "url": url,
        "description": story.get("description", "")[:500],
        "image": story.get("image", ""),
        "tags": story.get("tags", ["ai-news", "daily-brief", category]),
        "category": category,
        "source": story.get("source", "RSS"),
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
        # curl -f returns non-zero on HTTP errors (4xx/5xx)
        if result.returncode != 0:
            print(f"  ⚠️ LinkEntry HTTP error ({result.returncode}): {story.get('title', '')[:40]}")
            return False, None
        stdout = result.stdout
        # Last 3 chars are HTTP status code
        if len(stdout) >= 3:
            http_code = stdout[-3:]
            body = stdout[:-3]
            if http_code not in ("200", "201"):
                print(f"  ⚠️ LinkEntry HTTP {http_code}: {story.get('title', '')[:40]}")
                return False, None
            try:
                resp = json.loads(body)
                link_id = resp.get("data", {}).get("id") or resp.get("id")
                if link_id:
                    return True, link_id
            except json.JSONDecodeError:
                pass
    except Exception as e:
        print(f"  ⚠️ LinkEntry error: {e}")

    return False, None


# --- RSS Parsing ---

def fetch_feed_rss(source_name, feed_url):
    """Fetch and parse a single RSS feed."""
    entries = []

    try:
        data = fetch_url(feed_url)
    except Exception as e:
        print(f"  ⚠️ {source_name}: fetch failed ({e})")
        return entries

    if not data:
        return entries

    try:
        root = ET.fromstring(data)
    except ET.ParseError:
        # Try to fix common XML issues
        data = re.sub(r'&(?!amp;|lt;|gt;|quot;|apos;)', '&amp;', data)
        try:
            root = ET.fromstring(data)
        except ET.ParseError:
            return entries

    # Detect namespace
    ns = {}
    for elem in root:
        if elem.tag.startswith('{'):
            ns['ns'] = elem.tag.split('}')[0].strip('{')
            break

    is_atom = root.tag.endswith('}feed') or root.tag == 'feed'

    if is_atom:
        entries = parse_atom_entries(root, source_name, ns)
    else:
        entries = parse_rss_entries(root, source_name, ns)

    print(f"  📰 {source_name}: {len(entries)} recent entries")
    return entries


def parse_rss_entries(root, source_name, ns):
    """Parse RSS 2.0 entries."""
    entries = []
    ns_prefix = f"{{{ns['ns']}}}" if ns.get('ns') else ""

    for item in root.findall(".//item"):
        title_el = item.find("title")
        link_el = item.find("link")
        pub_el = item.find("pubDate") or item.find(f"{ns_prefix}pubDate")
        desc_el = item.find("description") or item.find(f"{ns_prefix}description")

        title = strip_html(title_el.text) if title_el is not None else "Untitled"
        link = link_el.text if link_el is not None else ""
        pub_date_str = pub_el.text if pub_el is not None else ""
        desc = strip_html(desc_el.text if desc_el is not None else "")[:500]

        pub_date = parse_iso_date(pub_date_str)
        if not is_recent(pub_date):
            continue

        # Calculate hours ago
        hours_ago = 999
        if pub_date:
            now = datetime.now(timezone.utc)
            if pub_date.tzinfo is None:
                pub_date = pub_date.replace(tzinfo=timezone.utc)
            hours_ago = (now - pub_date).total_seconds() / 3600

        entry = {
            "title": title,
            "link": link.strip() if link else "",
            "published": pub_date.isoformat() if pub_date else pub_date_str,
            "published_str": pub_date.strftime("%b %d, %Y") if pub_date else pub_date_str[:16],
            "description": desc,
            "source": source_name,
            "_hours_ago": hours_ago,
        }
        entries.append(entry)

    return entries


def parse_atom_entries(root, source_name, ns):
    """Parse Atom feed entries."""
    entries = []
    ns_uri = ns.get('ns', '')

    if ns_uri:
        entry_selector = f"{{{ns_uri}}}entry"
        entry_els = root.findall(f".//{entry_selector}")
        title_path = f"{{{ns_uri}}}title"
        link_path = f"{{{ns_uri}}}link"
        pub_path = f"{{{ns_uri}}}published"
        summary_path = f"{{{ns_uri}}}summary"
        content_path = f"{{{ns_uri}}}content"
    else:
        entry_els = root.findall(".//entry")
        title_path = "title"
        link_path = "link"
        pub_path = "published"
        summary_path = "summary"
        content_path = "content"

    for entry_el in entry_els:
        title_el = entry_el.find(title_path)
        link_el = entry_el.find(link_path)
        pub_el = entry_el.find(pub_path)
        summary_el = entry_el.find(summary_path)
        content_el = entry_el.find(content_path)

        title = strip_html(title_el.text if title_el is not None else "") or "Untitled"
        link = ""
        if link_el is not None:
            link = link_el.get("href", "") or link_el.text or ""
        pub_date_str = pub_el.text if pub_el is not None else ""

        content_text = ""
        if summary_el is not None:
            content_text = strip_html(summary_el.text or "")
        elif content_el is not None:
            content_text = strip_html(content_el.text or "")

        pub_date = parse_iso_date(pub_date_str)
        if not is_recent(pub_date):
            continue

        hours_ago = 999
        if pub_date:
            now = datetime.now(timezone.utc)
            if pub_date.tzinfo is None:
                pub_date = pub_date.replace(tzinfo=timezone.utc)
            hours_ago = (now - pub_date).total_seconds() / 3600

        entry = {
            "title": title,
            "link": link.strip() if link else "",
            "published": pub_date.isoformat() if pub_date else pub_date_str,
            "published_str": pub_date.strftime("%b %d, %Y") if pub_date else pub_date_str[:16],
            "description": content_text[:500],
            "source": source_name,
            "_hours_ago": hours_ago,
        }
        entries.append(entry)

    return entries


# --- Article Building ---

def build_rich_card(story, tldr):
    """Build a rich markdown card for a story."""
    title = story.get("title", "Untitled")
    link = story.get("link", "")
    source = story.get("source", "Unknown")
    date = story.get("published_str", "")
    desc = story.get("description", "")[:100]

    card = f"""<div class="news-card" style="margin-bottom: 1.5rem; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff;">
<h4 style="margin: 0 0 0.5rem 0;"><a href="{link}" style="color: #1f2937; text-decoration: none;">{title}</a></h4>
<p style="margin: 0 0 0.5rem 0; color: #374151; font-size: 0.95rem;">{tldr}</p>
<div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: #6b7280;">
<span>📰 {source} · {date}</span>
<span><button onclick="window.open('{link}', '_blank')" style="background: #3b82f6; color: white; border: none; padding: 0.25rem 0.75rem; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">Save to List</button></span>
</div>
</div>"""

    return card


def build_markdown_card(story, tldr, entity_data=None):
    """Build a markdown card with structured entity data for Nomi Brief LinkEntry."""
    title = story.get("title", "Untitled")
    link = story.get("link", "")
    source = story.get("source", "Unknown")
    date = story.get("published_str", "")
    desc = story.get("description", "")[:100]

    # Build entity JSON for LinkEntry
    if entity_data is None:
        entity_data = {
            "entity_type": "news_story",
            "title": title,
            "url": link,
            "summary": tldr[:200] if tldr else desc,
            "source": source,
            "image": story.get("image", ""),
            "tags": story.get("tags", ["ai-news", "daily-brief"]),
            "category": story.get("category", "news"),
        }

    entity_json = json.dumps(entity_data, ensure_ascii=False)

    card = f"""### 📰 {title}

**TLDR:** {tldr}

📖 [Read article]({link}) · *via {source} · {date}*

<!-- LINKENTRY_JSON:{entity_json} -->

---
"""
    return card


def build_article_content(stories, tldrs, category_key, category_info):
    """Build the article content for a category with structured entity data."""
    today = datetime.now(timezone.utc).strftime("%B %d, %Y")

    header = f"""# {category_info['name']}

*{category_info['description']}* · *Generated {today}*

---

"""

    cards = []
    for story in stories:
        tldr = tldrs.get(story.get("link", ""), story.get("description", "No summary available.")[:150])
        entity_data = {
            "entity_type": "news_story",
            "title": story.get("title", "Untitled"),
            "url": story.get("link", ""),
            "summary": tldr[:200] if tldr else story.get("description", "")[:100],
            "source": story.get("source", "Unknown"),
            "image": story.get("image", ""),
            "tags": category_info["tags"] + [story.get("source", "")],
            "category": category_key,
        }
        cards.append(build_markdown_card(story, tldr, entity_data))

    footer = f"""

---
*📬 Auto-generated by Nomi Vale · {len(stories)} stories*
"""

    return header + "\n".join(cards) + footer


# --- Main ---

def main():
    print(f"\n🤖 Nomi Brief Daily - {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    print("=" * 60)

    # Initialize database if available
    if DB_AVAILABLE:
        try:
            init_db()
            print("📦 Knowledge database initialized")
        except Exception as e:
            print(f"⚠️ Database init failed: {e}")

    # Load dedup state
    dedup = load_dedup()
    print(f"📂 Loaded dedup state: {len(dedup.get('published_urls', []))} published URLs")

    all_entries = []
    feed_count = 0

    # Fetch all feeds
    print("\n📡 Fetching RSS feeds...\n")
    for source_name, feed_url in RSS_FEEDS:
        print(f"Fetching {source_name}...")
        entries = fetch_feed_rss(source_name, feed_url)

        # Filter out duplicates
        new_entries = [e for e in entries if not is_duplicate(e, dedup)]
        if len(new_entries) < len(entries):
            print(f"  ↩️ Filtered {len(entries) - len(new_entries)} duplicates")

        all_entries.extend(new_entries)
        if entries:
            feed_count += 1

    print(f"\n📊 Feeds fetched: {feed_count}/{len(RSS_FEEDS)}")
    print(f"📊 Total entries (after dedup): {len(all_entries)}")

    if not all_entries:
        print("⚠️ No entries found. Exiting.")
        sys.exit(0)

    # Score and sort
    for e in all_entries:
        e["_score"] = score_entry(e)

    all_entries.sort(key=lambda e: (e["_score"], e.get("_hours_ago", 999)), reverse=True)

    # Categorize entries
    categorized = {cat: [] for cat in CATEGORIES}
    for entry in all_entries:
        cat = detect_category(entry.get("title", ""), entry.get("description", ""))
        categorized[cat].append(entry)

    # Limit each category
    for cat in categorized:
        categorized[cat] = categorized[cat][:MAX_ENTRIES_PER_CATEGORY]

    # Generate TLDRs in batches
    print("\n🧠 Generating AI TLDRs...\n")
    all_for_tldr = []
    for entries in categorized.values():
        all_for_tldr.extend(entries)

    tldrs = {}
    for i in range(0, len(all_for_tldr), BATCH_SIZE):
        batch = all_for_tldr[i:i+BATCH_SIZE]
        batch_tldrs = generate_tldr_batch(batch, MINIMAX_API_KEY)
        tldrs.update(batch_tldrs)
        print(f"  Processed batch {i//BATCH_SIZE + 1}/{(len(all_for_tldr)-1)//BATCH_SIZE + 1}")

    # Build and publish articles
    print("\n📤 Publishing to Nomi Brief...\n")
    published_articles = []
    total_stories = 0

    for cat_key, cat_info in CATEGORIES.items():
        entries = categorized[cat_key]
        if not entries:
            print(f"  ⏭️ {cat_info['name']}: No stories")
            continue

        content = build_article_content(entries, tldrs, cat_key, cat_info)
        title = f"{cat_info['name']} - {datetime.now(timezone.utc).strftime('%B %d, %Y')}"

        success, article_id = publish_article(
            title=title,
            content=content,
            category=cat_info['name'],
            tags=cat_info['tags'],
        )

        if success:
            published_articles.append({
                "category": cat_info['name'],
                "articleId": article_id,
                "storyCount": len(entries)
            })
            total_stories += len(entries)

            # Insert individual stories into database
            if DB_AVAILABLE:
                for entry in entries:
                    story_url = entry.get("link", "")
                    story_tldr = tldrs.get(story_url, entry.get("description", "")[:200])
                    article_dict = {
                        "title": entry.get("title", "Untitled"),
                        "url": story_url,
                        "summary": story_tldr,
                        "content": entry.get("description", ""),
                        "source": entry.get("source", "RSS"),
                        "category": cat_key,
                        "published_at": entry.get("published"),
                        "score": entry.get("_score", 0),
                    }
                    insert_article(article_dict)

            # Mark entries as published
            for entry in entries:
                mark_published(entry, dedup)
        else:
            print(f"  ❌ Failed to publish {cat_info['name']}")

    # Save dedup state
    save_dedup(dedup)

    # Save LinkEntries to Nomi Brief for all published stories
    print("\n📎 Saving stories to Nomi Brief LinkEntries...\n")
    linkentry_count = 0
    
    for article in published_articles:
        article_id = article.get("articleId")
        cat_key = next((k for k, v in CATEGORIES.items() if v["name"] == article["category"]), "news")
        
        for entry in categorized.get(cat_key, []):
            story_with_article = entry.copy()
            story_with_article["tags"] = CATEGORIES[cat_key]["tags"]
            story_with_article["category"] = cat_key
            
            success, linkentry_id = save_to_linkentry(story_with_article, article_id, cat_key)
            if success:
                linkentry_count += 1
    
    # Final summary
    print("\n📑 Categories:")
    for p in published_articles:
        print(f"   • {p['category']}: {p['storyCount']} stories")
    print()


if __name__ == "__main__":
    main()
