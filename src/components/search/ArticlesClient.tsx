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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#e5e5e5]">All Articles</h1>
          <p className="mt-2 text-[#737373]">
            {total > 0
              ? `${total} article${total !== 1 ? "s" : ""}${searchParams.get("q") ? ` matching "${searchParams.get("q")}"` : ""}`
              : "No articles found"}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <SearchInput placeholder="Search by title, content, or tags..." className="w-full max-w-xl" />
        <div className="flex items-center gap-4 flex-wrap">
          <SortSelect />
          <CategoryFilter />
        </div>
        <ActiveFilters />
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-[#525252] text-xs">
            Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
          </p>
        </div>
      )}

      {articles.length > 0 ? (
        <>
          <div className="grid gap-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              {page > 1 && (
                <Link
                  href={buildPageUrl(page - 1)}
                  className="px-3 py-2 rounded-lg bg-[#111111] border border-[#1c1c1c] text-[#737373] text-xs hover:border-[#2c2c2c] transition-colors"
                >
                  ← Prev
                </Link>
              )}
              <span className="px-3 py-2 text-[#525252] text-xs">
                {page} / {totalPages}
              </span>
              {hasMore && (
                <Link
                  href={buildPageUrl(page + 1)}
                  className="px-3 py-2 rounded-lg bg-[#111111] border border-[#1c1c1c] text-[#737373] text-xs hover:border-[#2c2c2c] transition-colors"
                >
                  Next →
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="bg-[#111111] border border-[#1c1c1c] rounded-xl p-12 text-center">
          {searchParams.get("q") || searchParams.get("category") ? (
            <>
              <p className="text-[#737373] text-lg">No articles match your filters</p>
              <p className="text-[#525252] text-sm mt-2">
                Try different search terms or{" "}
                <Link href="/articles" className="text-[#4ade80] hover:underline">
                  clear filters
                </Link>
              </p>
            </>
          ) : (
            <>
              <p className="text-[#737373] text-lg">No articles yet</p>
              <p className="text-[#525252] text-sm mt-2">
                Configure the OpenClaw webhook to receive AI-generated articles
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
