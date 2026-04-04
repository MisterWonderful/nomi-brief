#!/usr/bin/env python3
"""
Knowledge Database Helper for Ryan's AI News & Tech Intelligence System
Manages SQLite database at /home/node/.openclaw/workspace/data/knowledge.db
"""

import sqlite3
import json
import hashlib
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

DB_PATH = "/home/node/.openclaw/workspace/data/knowledge.db"


def get_connection() -> sqlite3.Connection:
    """Get a database connection with row factory."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Create all tables and indexes if they don't exist."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Articles table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS articles (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            url TEXT UNIQUE NOT NULL,
            summary TEXT,
            content TEXT,
            source TEXT,
            category TEXT,
            keywords TEXT,
            published_at TEXT,
            fetched_at TEXT,
            score INTEGER,
            is_read INTEGER DEFAULT 0,
            is_favorite INTEGER DEFAULT 0
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category)")
    
    # GitHub projects table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS github_projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            owner TEXT NOT NULL,
            repo TEXT NOT NULL,
            description TEXT,
            url TEXT NOT NULL,
            stars INTEGER DEFAULT 0,
            language TEXT,
            topics TEXT,
            fetched_at TEXT,
            last_seen TEXT,
            homelab_relevance TEXT,
            monetization_potential TEXT,
            tl_dr TEXT,
            why_it_matters TEXT,
            UNIQUE(owner, repo)
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_projects_stars ON github_projects(stars DESC)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_projects_language ON github_projects(language)")
    
    # Model releases table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS model_releases (
            id TEXT PRIMARY KEY,
            model_name TEXT NOT NULL,
            provider TEXT NOT NULL,
            release_date TEXT,
            benchmarks TEXT,
            context_window INTEGER,
            strengths TEXT,
            weaknesses TEXT,
            pricing_input INTEGER,
            pricing_output INTEGER,
            url TEXT,
            notes TEXT,
            fetched_at TEXT,
            UNIQUE(model_name, provider)
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_models_provider ON model_releases(provider)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_models_release ON model_releases(release_date DESC)")
    
    # Knowledge entities table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS knowledge_entities (
            id TEXT PRIMARY KEY,
            entity_name TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            description TEXT,
            summary TEXT,
            source_url TEXT,
            discovered_at TEXT,
            updated_at TEXT,
            metadata TEXT
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_entities_type ON knowledge_entities(entity_type)")
    
    # Ingestion log table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ingestion_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT NOT NULL,
            item_id TEXT NOT NULL,
            action TEXT NOT NULL,
            happened_at TEXT
        )
    """)
    
    # FTS5 virtual table for articles full-text search
    cursor.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
            title, summary, content,
            content=articles,
            content_rowid=rowid
        )
    """)
    
    # Triggers to keep FTS in sync with articles table
    cursor.execute("""
        CREATE TRIGGER IF NOT EXISTS articles_ai AFTER INSERT ON articles BEGIN
            INSERT INTO articles_fts(rowid, title, summary, content) 
            VALUES (new.rowid, new.title, new.summary, new.content);
        END
    """)
    
    cursor.execute("""
        CREATE TRIGGER IF NOT EXISTS articles_ad AFTER DELETE ON articles BEGIN
            INSERT INTO articles_fts(articles_fts, rowid, title, summary, content) 
            VALUES ('delete', old.rowid, old.title, old.summary, old.content);
        END
    """)
    
    cursor.execute("""
        CREATE TRIGGER IF NOT EXISTS articles_au AFTER UPDATE ON articles BEGIN
            INSERT INTO articles_fts(articles_fts, rowid, title, summary, content) 
            VALUES ('delete', old.rowid, old.title, old.summary, old.content);
            INSERT INTO articles_fts(rowid, title, summary, content) 
            VALUES (new.rowid, new.title, new.summary, new.content);
        END
    """)
    
    conn.commit()
    conn.close()


def _generate_id(text: str) -> str:
    """Generate a short hash ID from text."""
    return hashlib.md5(text.encode()).hexdigest()[:12]


def _now_iso() -> str:
    """Return current UTC time as ISO string."""
    return datetime.utcnow().isoformat() + "Z"


def _log_ingestion(conn: sqlite3.Connection, source: str, item_id: str, action: str) -> None:
    """Log an ingestion action."""
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO ingestion_log (source, item_id, action, happened_at) VALUES (?, ?, ?, ?)",
        (source, item_id, action, _now_iso())
    )


def insert_article(article_dict: Dict[str, Any]) -> bool:
    """
    Insert or replace an article. Returns True if inserted, False if already existed.
    Logs action to ingestion_log.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    # Generate ID from URL if not provided
    article_id = article_dict.get("id") or _generate_id(article_dict.get("url", ""))
    
    # Check if exists
    cursor.execute("SELECT id FROM articles WHERE id = ?", (article_id,))
    exists = cursor.fetchone() is not None
    
    # Serialize keywords to JSON if list
    keywords = article_dict.get("keywords")
    if isinstance(keywords, list):
        keywords = json.dumps(keywords)
    
    cursor.execute("""
        INSERT OR REPLACE INTO articles (
            id, title, url, summary, content, source, category, keywords,
            published_at, fetched_at, score, is_read, is_favorite
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        article_id,
        article_dict.get("title", ""),
        article_dict.get("url", ""),
        article_dict.get("summary"),
        article_dict.get("content"),
        article_dict.get("source"),
        article_dict.get("category"),
        keywords,
        article_dict.get("published_at"),
        article_dict.get("fetched_at") or _now_iso(),
        article_dict.get("score", 0),
        article_dict.get("is_read", 0),
        article_dict.get("is_favorite", 0)
    ))
    
    _log_ingestion(conn, article_dict.get("source", "unknown"), article_id, "published" if not exists else "deduplicated")
    
    conn.commit()
    conn.close()
    return not exists


def insert_github_project(project_dict: Dict[str, Any]) -> bool:
    """
    Insert or replace a GitHub project. Updates last_seen if exists.
    Returns True if inserted, False if already existed.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    owner = project_dict.get("owner", "")
    repo = project_dict.get("repo", "")
    project_id = f"{owner}/{repo}"
    
    # Check if exists
    cursor.execute("SELECT id FROM github_projects WHERE id = ?", (project_id,))
    exists = cursor.fetchone() is not None
    
    # Serialize topics to JSON if list
    topics = project_dict.get("topics")
    if isinstance(topics, list):
        topics = json.dumps(topics)
    
    now = _now_iso()
    
    cursor.execute("""
        INSERT OR REPLACE INTO github_projects (
            id, name, owner, repo, description, url, stars, language, topics,
            fetched_at, last_seen, homelab_relevance, monetization_potential,
            tl_dr, why_it_matters
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        project_id,
        project_dict.get("name", repo),
        owner,
        repo,
        project_dict.get("description"),
        project_dict.get("url", f"https://github.com/{owner}/{repo}"),
        project_dict.get("stars", 0),
        project_dict.get("language"),
        topics,
        project_dict.get("fetched_at") or now,
        now,  # Update last_seen on every insert
        project_dict.get("homelab_relevance"),
        project_dict.get("monetization_potential"),
        project_dict.get("tl_dr"),
        project_dict.get("why_it_matters")
    ))
    
    _log_ingestion(conn, "github", project_id, "published" if not exists else "deduplicated")
    
    conn.commit()
    conn.close()
    return not exists


def insert_model_release(model_dict: Dict[str, Any]) -> bool:
    """
    Insert or replace a model release. Returns True if inserted, False if already existed.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    model_name = model_dict.get("model_name", "")
    provider = model_dict.get("provider", "")
    model_id = model_dict.get("id") or _generate_id(f"{provider}:{model_name}")
    
    # Check if exists
    cursor.execute("SELECT id FROM model_releases WHERE id = ?", (model_id,))
    exists = cursor.fetchone() is not None
    
    # Serialize benchmarks to JSON if dict
    benchmarks = model_dict.get("benchmarks")
    if isinstance(benchmarks, dict):
        benchmarks = json.dumps(benchmarks)
    
    cursor.execute("""
        INSERT OR REPLACE INTO model_releases (
            id, model_name, provider, release_date, benchmarks, context_window,
            strengths, weaknesses, pricing_input, pricing_output, url, notes, fetched_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        model_id,
        model_name,
        provider,
        model_dict.get("release_date"),
        benchmarks,
        model_dict.get("context_window"),
        model_dict.get("strengths"),
        model_dict.get("weaknesses"),
        model_dict.get("pricing_input"),
        model_dict.get("pricing_output"),
        model_dict.get("url"),
        model_dict.get("notes"),
        model_dict.get("fetched_at") or _now_iso()
    ))
    
    _log_ingestion(conn, "models", model_id, "published" if not exists else "deduplicated")
    
    conn.commit()
    conn.close()
    return not exists


def get_recent_articles(days: int = 2, category: Optional[str] = None, limit: int = 50) -> List[Dict]:
    """Fetch recent articles, optionally filtered by category."""
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat() + "Z"
    
    if category:
        cursor.execute("""
            SELECT * FROM articles 
            WHERE published_at >= ? AND category = ?
            ORDER BY published_at DESC LIMIT ?
        """, (cutoff, category, limit))
    else:
        cursor.execute("""
            SELECT * FROM articles WHERE published_at >= ?
            ORDER BY published_at DESC LIMIT ?
        """, (cutoff, limit))
    
    rows = cursor.fetchall()
    conn.close()
    
    articles = []
    for row in rows:
        article = dict(row)
        # Parse keywords JSON
        if article.get("keywords"):
            try:
                article["keywords"] = json.loads(article["keywords"])
            except:
                article["keywords"] = []
        articles.append(article)
    
    return articles


def get_top_github_projects(limit: int = 20, min_stars: int = 100) -> List[Dict]:
    """Fetch top GitHub projects by stars."""
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM github_projects 
        WHERE stars >= ? 
        ORDER BY stars DESC LIMIT ?
    """, (min_stars, limit))
    
    rows = cursor.fetchall()
    conn.close()
    
    projects = []
    for row in rows:
        project = dict(row)
        # Parse topics JSON
        if project.get("topics"):
            try:
                project["topics"] = json.loads(project["topics"])
            except:
                project["topics"] = []
        projects.append(project)
    
    return projects


def get_model_by_name(name: str) -> Optional[Dict]:
    """Look up a specific model by name."""
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM model_releases 
        WHERE model_name LIKE ? OR id LIKE ?
        LIMIT 1
    """, (f"%{name}%", f"%{name}%"))
    
    row = cursor.fetchone()
    conn.close()
    
    if row:
        model = dict(row)
        # Parse benchmarks JSON
        if model.get("benchmarks"):
            try:
                model["benchmarks"] = json.loads(model["benchmarks"])
            except:
                pass
        return model
    return None


def search_articles(query: str, limit: int = 20) -> List[Dict]:
    """Full-text search on articles using FTS5."""
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Escape special FTS characters and add wildcard for partial matching
    safe_query = query.replace('"', '""')
    fts_query = f'"{safe_query}"*'
    
    try:
        cursor.execute("""
            SELECT a.* FROM articles a
            JOIN articles_fts f ON a.rowid = f.rowid
            WHERE articles_fts MATCH ?
            ORDER BY rank LIMIT ?
        """, (fts_query, limit))
        
        rows = cursor.fetchall()
        conn.close()
        
        articles = []
        for row in rows:
            article = dict(row)
            if article.get("keywords"):
                try:
                    article["keywords"] = json.loads(article["keywords"])
                except:
                    article["keywords"] = []
            articles.append(article)
        
        return articles
    except sqlite3.FtsError:
        # Fallback to LIKE search if FTS fails
        conn.close()
        return search_articles_like(query, limit)


def search_articles_like(query: str, limit: int = 20) -> List[Dict]:
    """Fallback article search using LIKE."""
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    pattern = f"%{query}%"
    cursor.execute("""
        SELECT * FROM articles 
        WHERE title LIKE ? OR summary LIKE ? OR content LIKE ?
        ORDER BY published_at DESC LIMIT ?
    """, (pattern, pattern, pattern, limit))
    
    rows = cursor.fetchall()
    conn.close()
    
    articles = []
    for row in rows:
        article = dict(row)
        if article.get("keywords"):
            try:
                article["keywords"] = json.loads(article["keywords"])
            except:
                article["keywords"] = []
        articles.append(article)
    
    return articles


def mark_article_read(article_id: str) -> bool:
    """Mark an article as read."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE articles SET is_read = 1 WHERE id = ?", (article_id,))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0


def mark_article_favorite(article_id: str, favorite: bool = True) -> bool:
    """Mark or unmark an article as favorite."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE articles SET is_favorite = ? WHERE id = ?", (1 if favorite else 0, article_id))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0


def article_exists(url: str) -> bool:
    """Check if an article with this URL already exists."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM articles WHERE url = ?", (url,))
    exists = cursor.fetchone() is not None
    conn.close()
    return exists


def prune_old_articles(days: int = 30) -> int:
    """Delete articles older than specified days. Returns count deleted."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat() + "Z"
    cursor.execute("DELETE FROM articles WHERE published_at < ?", (cutoff,))
    deleted = cursor.rowcount
    conn.commit()
    conn.close()
    return deleted


def get_ingestion_stats() -> Dict:
    """Get summary statistics about the database."""
    conn = get_connection()
    cursor = conn.cursor()
    
    stats = {}
    
    cursor.execute("SELECT COUNT(*) FROM articles")
    stats["total_articles"] = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM github_projects")
    stats["total_github_projects"] = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM model_releases")
    stats["total_models"] = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM knowledge_entities")
    stats["total_entities"] = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM ingestion_log")
    stats["total_ingestions"] = cursor.fetchone()[0]
    
    conn.close()
    return stats


if __name__ == "__main__":
    init_db()
    print("DB OK")
    print("Stats:", get_ingestion_stats())
