#!/usr/bin/env python3
"""
Update the knowledge base with fresh data from GitHub trending and model releases.
Run daily to keep the KB current.
"""

import json
import os
import sys
import re
import hashlib
import subprocess
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

# Add scripts dir to path for db_helper
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db_helper import (
    init_db, insert_github_project, insert_model_release,
    insert_article, get_top_github_projects
)

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
MINIMAX_API_KEY = os.environ.get("MINIMAX_API_KEY", "")
MINIMAX_BASE = "https://api.minimax.io/v1"

# --- Helpers ---

def fetch_url(url, headers=None, timeout=15):
    req = Request(url, headers=headers or {
        "User-Agent": "NomiBrief/1.0",
        "Accept": "application/vnd.github+json",
    })
    if GITHUB_TOKEN:
        req.add_header("Authorization", f"Bearer {GITHUB_TOKEN}")
    try:
        with urlopen(req, timeout=timeout) as r:
            return r.read().decode("utf-8", errors="replace")
    except HTTPError as e:
        if e.code == 403:
            print(f"  ⚠️ GitHub rate limited, backing off...")
        else:
            print(f"  ⚠️ HTTP {e.code}: {url}")
        return ""
    except Exception as e:
        print(f"  ⚠️ {e}")
        return ""


def gh_api(url):
    """GitHub API request with auth."""
    return fetch_url(url, headers={
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
    })


def parse_github_trending():
    """Fetch and parse GitHub trending repos."""
    print("📡 Fetching GitHub trending...")
    repos = []

    # Try the Atom feed first
    data = fetch_url("https://github.com/trending.atom")
    if not data:
        # Fallback: scrape the HTML page
        data = fetch_url("https://github.com/trending",
                         headers={"User-Agent": "NomiBrief/1.0"})

    # Also try the API for top repos by language
    for lang in ["Python", "TypeScript", "Rust", "Go"]:
        url = f"https://api.github.com/search/repositories?q=created:>2025-01-01+language:{lang}&sort=stars&order=desc&per_page=20"
        data = gh_api(url)
        if data:
            try:
                result = json.loads(data)
                for item in result.get("items", [])[:10]:
                    repo = {
                        "id": f"{item['owner']['login']}/{item['name']}",
                        "name": item["name"],
                        "owner": item["owner"]["login"],
                        "repo": item["name"],
                        "description": item.get("description", ""),
                        "url": item["html_url"],
                        "stars": item.get("stargazers_count", 0),
                        "language": item.get("language", ""),
                        "topics": json.dumps(item.get("topics", [])),
                        "fetched_at": datetime.now(timezone.utc).isoformat(),
                        "last_seen": datetime.now(timezone.utc).isoformat(),
                    }
                    repos.append(repo)
            except (json.JSONDecodeError, KeyError):
                pass

    print(f"  Found {len(repos)} trending repos")
    return repos


def enrich_repo(owner, repo):
    """Enrich a repo with full GitHub API data."""
    data = gh_api(f"https://api.github.com/repos/{owner}/{repo}")
    if not data:
        return None
    try:
        item = json.loads(data)
        return {
            "id": f"{owner}/{repo}",
            "name": item["name"],
            "owner": owner,
            "repo": item["name"],
            "description": item.get("description", ""),
            "url": item["html_url"],
            "stars": item.get("stargazers_count", 0),
            "language": item.get("language", ""),
            "topics": json.dumps(item.get("topics", [])),
            "fetched_at": datetime.now(timezone.utc).isoformat(),
            "last_seen": datetime.now(timezone.utc).isoformat(),
        }
    except (json.JSONDecodeError, KeyError):
        return None


def assess_repo(repo):
    """AI assessment of homelab relevance and monetization potential."""
    text = f"{repo.get('name','')} {repo.get('description','')} {' '.join(json.loads(repo.get('topics','[]')))}"
    text = text.lower()

    homelab = "low"
    if any(k in text for k in ["docker", "self-host", "homelab", "raspberry", "server", "agent", "mcp", "openclaw", "home automation", "nas", "server"]):
        homelab = "high"
    elif any(k in text for k in ["ai", "llm", "model", "coding", "dev", "tool"]):
        homelab = "medium"

    mon = "low"
    if any(k in text for k in ["saas", "api", "product", "startup", "paid", "subscription"]):
        mon = "high"
    elif any(k in text for k in ["open source", "library", "framework", "tool"]):
        mon = "medium"

    repo["homelab_relevance"] = homelab
    repo["monetization_potential"] = mon
    repo["tldr"] = f"{repo.get('name', 'this project')} — {repo.get('description', 'a GitHub project')}"
    repo["why_it_matters"] = f"GitHub repo {repo.get('name')} with {repo.get('stars', 0)} stars, relevant for {homelab} homelab use and {mon} monetization potential."
    return repo


def check_model_releases():
    """Check for new model releases via web search."""
    print("📡 Checking for new model releases...")

    # Use MiniMax web search if available
    if MINIMAX_API_KEY:
        try:
            payload = {
                "model": "minimax-m2.7",
                "messages": [{"role": "user", "content": "List any major AI model releases or announcements from the past 7 days (April 2026). For each: model name, provider company, key capabilities, benchmark scores if known, and release date. Format as JSON array."}],
                "max_tokens": 1000,
                "thinking": "off"
            }
            result = subprocess.run([
                "curl", "-s", "-X", "POST",
                f"{MINIMAX_BASE}/chat/completions",
                "-H", f"Authorization: Bearer {MINIMAX_API_KEY}",
                "-H", "Content-Type: application/json",
                "-d", json.dumps(payload)
            ], capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                data = json.loads(result.stdout)
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                # Strip thinking tags before parsing
                import re
                clean = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL).strip()
                try:
                    # Strip markdown code fences if present
                    if clean.startswith("```"):
                        clean = re.sub(r'^```(?:json)?\s*', '', clean)
                        clean = re.sub(r'\s*```$', '', clean)
                    models = json.loads(clean)
                    for m in models if isinstance(models, list) else []:
                        insert_model_release({
                            "id": hashlib.md5(f"{m.get('model_name','')}{m.get('provider','')}".encode()).hexdigest(),
                            "model_name": m.get("model_name", ""),
                            "provider": m.get("provider", ""),
                            "release_date": m.get("release_date", datetime.now(timezone.utc).isoformat()),
                            "benchmarks": json.dumps(m.get("benchmarks", {})),
                            "context_window": m.get("context_window", 0),
                            "strengths": m.get("strengths", ""),
                            "weaknesses": m.get("weaknesses", ""),
                            "url": m.get("url", ""),
                            "fetched_at": datetime.now(timezone.utc).isoformat(),
                        })
                    print(f"  Added {len(models) if isinstance(models, list) else 0} model releases")
                except json.JSONDecodeError:
                    print(f"  Model search response not parseable as JSON")
                    print(f"  Response: {content[:200]}")
        except Exception as e:
            print(f"  ⚠️ Model search failed: {e}")
    else:
        print("  ⚠️ No MINIMAX_API_KEY, skipping model releases")


def prune_old_articles(days=30):
    """Remove articles older than N days to keep DB lean."""
    import sqlite3
    db_path = os.path.expanduser("~/.openclaw/workspace/data/knowledge.db")
    if not os.path.exists(db_path):
        return
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    cur.execute("DELETE FROM articles WHERE fetched_at < ?", (cutoff.isoformat(),))
    deleted = cur.rowcount
    conn.commit()
    conn.close()
    if deleted > 0:
        print(f"🗑️ Pruned {deleted} old articles (>30 days)")


def main():
    print(f"\n🧠 Knowledge Base Update — {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}\n")

    init_db()

    # 1. Refresh GitHub trending
    trending = parse_github_trending()

    # 2. Enrich top 30 by GitHub API
    print("🔧 Enriching repos via GitHub API...")
    enriched = 0
    for repo in trending[:30]:
        owner = repo.get("owner", repo.get("id", "").split("/")[0] if "/" in repo.get("id", "") else "")
        name = repo.get("repo", repo.get("name", ""))
        if owner and name:
            full = enrich_repo(owner, name)
            if full:
                full = assess_repo(full)
                insert_github_project(full)
                enriched += 1
    print(f"  Enriched {enriched} repos")

    # 3. Check model releases
    check_model_releases()

    # 4. Prune old articles
    prune_old_articles(days=30)

    # 5. Summary
    print("\n📊 Knowledge Base Summary:")
    projects = get_top_github_projects(limit=5)
    print(f"  Top 5 projects by stars:")
    for p in projects:
        print(f"    {p['stars']}⭐ {p['name']} — {p.get('description','')[:60]}")

    print("\n✅ Knowledge base updated!")


if __name__ == "__main__":
    main()
