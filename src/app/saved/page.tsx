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
      prisma.article.count({ where: { userId: user.id, isSaved: true, isPublished: true } }),
    ]);
    return { articles, total, page, pageSize };
  } catch (error) {
    console.error("Error fetching saved articles:", error);
    return { articles: [], total: 0, page: 1, pageSize: 20 };
  }
}

export default async function SavedPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const resolved = await searchParams;
  const { articles, total, page, pageSize } = await getSavedArticles(resolved);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Bookmark className="w-7 h-7 text-[#525252]" />
        <div>
          <h1 className="text-xl font-semibold text-[#e5e5e5]">Saved for Later</h1>
          <p className="text-sm text-[#525252] mt-1">
            {total} article{total !== 1 ? "s" : ""} saved
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <Link
          href="/saved"
          className="px-3 py-1.5 text-xs font-medium rounded-full bg-[#111111] text-[#4ade80] border border-[#1c1c1c]"
        >
          All ({total})
        </Link>
      </div>

      <Suspense fallback={<div className="text-[#525252]">Loading...</div>}>
        {articles.length > 0 ? (
          <div className="space-y-3">
            <ArticlesClient articles={articles} total={total} page={page} pageSize={pageSize} hasMore={page * pageSize < total} />
          </div>
        ) : (
          <div className="text-center py-20">
            <Bookmark className="w-12 h-12 text-[#525252] mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-[#737373] mb-2">No saved articles yet</h2>
            <p className="text-sm text-[#525252] max-w-xs mx-auto">
              Tap the bookmark icon on any article to save it here for later.
            </p>
            <Link
              href="/articles"
              className="inline-block mt-6 px-4 py-2 text-sm font-medium bg-[#111111] text-[#4ade80] border border-[#1c1c1c] hover:border-[#2c2c2c] rounded-xl transition-colors"
            >
              Browse articles
            </Link>
          </div>
        )}
      </Suspense>
    </div>
  );
}
