"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ArticleCard } from "./ArticleCard";
import { Loader2 } from "lucide-react";
import { isToday, isYesterday, format } from "date-fns";

interface Article {
  id: string;
  title: string;
  subtitle?: string | null;
  authorName: string;
  authorAvatar?: string | null;
  coverImage?: string | null;
  category: string;
  tags?: string[];
  readTime: number;
  publishedAt: Date | string;
  isRead?: boolean;
  isFavorite?: boolean;
}

interface ArticlesResponse {
  data: Article[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function DateSeparator({ date }: { date: Date }) {
  const isTodayDate = isToday(date);
  const isYesterdayDate = isYesterday(date);

  let label: string;
  if (isTodayDate) {
    label = "Today";
  } else if (isYesterdayDate) {
    label = "Yesterday";
  } else {
    label = format(date, "EEEE, MMMM d");
  }

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px bg-zinc-800/60" />
      <span className={`text-[10px] font-semibold uppercase tracking-widest px-2 ${
        isTodayDate ? "text-emerald-400/80" : "text-zinc-600"
      }`}>
        {label}
      </span>
      <div className="flex-1 h-px bg-zinc-800/60" />
    </div>
  );
}

export function ArticleFeed() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const PAGE_SIZE = 50;

  const fetchArticles = useCallback(async (pageNum: number) => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(
        `/api/articles?page=${pageNum}&pageSize=${PAGE_SIZE}&sort=newest`
      );
      if (!res.ok) throw new Error("Failed to fetch");

      const json: ArticlesResponse = await res.json();

      setArticles((prev) => {
        const existing = new Set(prev.map((a) => a.id));
        const newArticles = json.data.filter((a) => !existing.has(a.id));
        return [...prev, ...newArticles];
      });

      setHasMore(pageNum < json.totalPages);
    } catch (err) {
      console.error("Error fetching articles:", err);
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  }, [loading]);

  // Initial load
  useEffect(() => {
    fetchArticles(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchArticles(nextPage);
        }
      },
      { rootMargin: "400px" }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, loading, page, fetchArticles]);

  // Group articles by date for date separators
  function groupArticlesByDate(arts: Article[]): Array<{ date: Date; articles: Article[] }> {
    const groups: Map<string, { date: Date; articles: Article[] }> = new Map();

    for (const article of arts) {
      const date = new Date(article.publishedAt);
      const dateKey = date.toISOString().slice(0, 10); // YYYY-MM-DD

      if (!groups.has(dateKey)) {
        groups.set(dateKey, { date, articles: [] });
      }
      groups.get(dateKey)!.articles.push(article);
    }

    return Array.from(groups.values()).sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );
  }

  if (!initialLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 text-[#4ade80] animate-spin" />
        <span className="ml-2.5 text-sm text-zinc-500">Loading…</span>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="rounded-xl p-10 text-center border border-[#1c1c1c]">
        <p className="text-zinc-400 text-sm">No articles yet</p>
        <p className="text-zinc-600 text-xs mt-1.5">
          AI-curated briefs arrive daily via webhook
        </p>
      </div>
    );
  }

  const groups = groupArticlesByDate(articles);

  return (
    <div className="flex flex-col gap-1">
      {groups.map((group) => (
        <div key={group.date.toISOString().slice(0, 10)}>
          <DateSeparator date={group.date} />
          <div className="flex flex-col gap-2">
            {group.articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      ))}

      {/* Sentinel */}
      {hasMore && (
        <div ref={sentinelRef} className="flex items-center justify-center py-6">
          {loading && (
            <Loader2 className="w-4 h-4 text-zinc-600 animate-spin" />
          )}
        </div>
      )}

      {!hasMore && articles.length > 0 && (
        <div className="text-center pt-8 pb-2">
          <p className="text-[11px] text-zinc-700">
            {articles.length} articles · Nomi Brief
          </p>
        </div>
      )}
    </div>
  );
}
