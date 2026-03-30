import { Suspense } from "react";
import { prisma, upsertDefaultUser } from "@/lib/prisma";
import { ArticlesClient } from "@/components/search/ArticlesClient";
import Link from "next/link";
import { Bookmark } from "lucide-react";

export const dynamic = "force-dynamic";

interface SearchParams {
  page?: string;
}

async function getSavedArticles(searchParams: SearchParams) {
  try {
    const user = await upsertDefaultUser();
    const page = Math.max(1, parseInt(searchParams.page || "1"));
    const pageSize = 20;

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where: { userId: user.id, isSaved: true, isPublished: true },
        orderBy: { savedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.article.count({
        where: { userId: user.id, isSaved: true, isPublished: true },
      }),
    ]);

    return { articles, total, page, pageSize };
  } catch (error) {
    console.error("Error fetching saved articles:", error);
    return { articles: [], total: 0, page: 1, pageSize: 20 };
  }
}

export default async function SavedPage({ searchParams }: { searchParams: SearchParams }) {
  const { articles, total, page, pageSize } = await getSavedArticles(searchParams);

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Bookmark className="w-7 h-7 text-violet-400" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">
              Saved for Later
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              {total} article{total !== 1 ? "s" : ""} saved
            </p>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <Link
            href="/saved"
            className="px-3 py-1.5 text-xs font-medium rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30"
          >
            All ({total})
          </Link>
        </div>

        <Suspense fallback={<div className="text-zinc-500">Loading...</div>}>
          {articles.length > 0 ? (
            <div className="space-y-3">
              <ArticlesClient
                articles={articles}
                total={total}
                page={page}
                pageSize={pageSize}
                hasMore={page * pageSize < total}
              />
            </div>
          ) : (
            <div className="text-center py-20">
              <Bookmark className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-zinc-400 mb-2">No saved articles yet</h2>
              <p className="text-sm text-zinc-600 max-w-xs mx-auto">
                Tap the bookmark icon on any article to save it here for later. GitHub projects and interesting finds go here too.
              </p>
              <Link
                href="/articles"
                className="inline-block mt-6 px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-colors"
              >
                Browse articles
              </Link>
            </div>
          )}
        </Suspense>
      </div>
    </div>
  );
}
