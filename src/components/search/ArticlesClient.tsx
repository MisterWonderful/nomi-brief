"use client";

import { useSearchParams } from "next/navigation";
import { ArticleCard } from "@/components/ArticleCard";
import { SearchInput } from "@/components/search/SearchInput";
import { SortSelect } from "@/components/search/SortSelect";
import { CategoryFilter } from "@/components/search/CategoryFilter";
import { ActiveFilters } from "@/components/search/ActiveFilters";
import Link from "next/link";

const PAGE_SIZE = 20;

interface Article {
  id: string;
  title: string;
  subtitle: string | null;
  authorName: string;
  authorAvatar: string | null;
  coverImage: string | null;
  category: string;
  tags: string[];
  readTime: number;
  publishedAt: Date;
  isRead: boolean;
  isFavorite: boolean;
}

interface ArticlesClientProps {
  articles: Article[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export function ArticlesClient({ articles, total, page, pageSize, hasMore }: ArticlesClientProps) {
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(total / pageSize);

  const buildPageUrl = (p: number) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("page", String(p));
    return `/articles?${sp.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white font-display">All Articles</h1>
          <p className="mt-2 text-zinc-400">
            {total > 0
              ? `${total} article${total !== 1 ? "s" : ""}${searchParams.get("q") ? ` matching "${searchParams.get("q")}"` : ""}`
              : "No articles found"}
          </p>
        </div>
      </div>

      {/* Search + Controls */}
      <div className="space-y-4">
        <SearchInput placeholder="Search by title, content, or tags..." className="w-full max-w-xl" />
        <div className="flex items-center gap-4 flex-wrap">
          <SortSelect />
          <CategoryFilter />
        </div>
        <ActiveFilters />
      </div>

      {/* Pagination info */}
      {total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-zinc-600 text-xs">
            Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
          </p>
        </div>
      )}

      {/* Articles Grid */}
      {articles.length > 0 ? (
        <>
          <div className="grid gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              {page > 1 && (
                <Link
                  href={buildPageUrl(page - 1)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors"
                >
                  ← Previous
                </Link>
              )}
              <span className="px-4 py-2 text-zinc-600 text-sm">
                Page {page} of {totalPages}
              </span>
              {hasMore && (
                <Link
                  href={buildPageUrl(page + 1)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors"
                >
                  Next →
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="glass rounded-2xl p-12 text-center">
          {searchParams.get("q") || searchParams.get("category") ? (
            <>
              <p className="text-zinc-400 text-lg">No articles match your filters</p>
              <p className="text-zinc-600 text-sm mt-2">
                Try different search terms or{" "}
                <Link href="/articles" className="text-violet-400 hover:underline">
                  clear filters
                </Link>
              </p>
            </>
          ) : (
            <>
              <p className="text-zinc-400 text-lg">No articles yet</p>
              <p className="text-zinc-600 text-sm mt-2">
                Configure the OpenClaw webhook to receive AI-generated articles
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
