"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ArticleCard } from "./ArticleCard";
import { Loader2 } from "lucide-react";

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
        // Deduplicate by id
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

  if (!initialLoaded) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
        <span className="ml-3 text-sm text-zinc-400">Loading articles…</span>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <p className="text-zinc-400 text-lg">No articles yet</p>
        <p className="text-zinc-600 text-sm mt-2">
          Configure the OpenClaw webhook to receive AI-generated articles
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}

      {/* Sentinel element for infinite scroll */}
      {hasMore && (
        <div ref={sentinelRef} className="flex items-center justify-center py-8">
          {loading && (
            <>
              <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
              <span className="ml-2 text-xs text-zinc-500">Loading more…</span>
            </>
          )}
        </div>
      )}

      {/* End of feed */}
      {!hasMore && articles.length > 0 && (
        <div className="text-center py-8">
          <p className="text-xs text-zinc-600">You&apos;ve reached the end</p>
        </div>
      )}
    </div>
  );
}
