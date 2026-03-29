import { Suspense } from "react";
import { prisma, upsertDefaultUser } from "@/lib/prisma";
import { ArticlesClient } from "@/components/search/ArticlesClient";

// Force dynamic rendering to support search params
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

interface SearchParams {
  q?: string;
  category?: string;
  sort?: string;
  unreadOnly?: string;
  page?: string;
  favorites?: string;
}

async function getArticles(searchParams: SearchParams) {
  try {
    const user = await upsertDefaultUser();
    const page = Math.max(1, parseInt(searchParams.page || "1"));

    const where: Record<string, unknown> = {
      userId: user.id,
      isPublished: true,
    };

    if (searchParams.category) {
      where.category = searchParams.category;
    }

    if (searchParams.q) {
      where.OR = [
        { title: { contains: searchParams.q, mode: "insensitive" } },
        { subtitle: { contains: searchParams.q, mode: "insensitive" } },
        { content: { contains: searchParams.q, mode: "insensitive" } },
        { tags: { has: searchParams.q } },
      ];
    }

    if (searchParams.unreadOnly === "1") {
      where.isRead = false;
    }

    if (searchParams.favorites === "1") {
      where.isFavorite = true;
    }

    const orderBy =
      searchParams.sort === "oldest"
        ? { publishedAt: "asc" as const }
        : searchParams.sort === "readTime"
          ? { readTime: "asc" as const }
          : searchParams.sort === "favorites"
            ? { isFavorite: "desc" as const }
            : { publishedAt: "desc" as const };

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          title: true,
          subtitle: true,
          authorName: true,
          authorAvatar: true,
          coverImage: true,
          category: true,
          tags: true,
          readTime: true,
          publishedAt: true,
          isRead: true,
          isFavorite: true,
        },
      }),
      prisma.article.count({ where }),
    ]);

    return { articles, total, page, pageSize: PAGE_SIZE, hasMore: page * PAGE_SIZE < total };
  } catch (error) {
    console.error("Error fetching articles:", error);
    return { articles: [], total: 0, page: 1, pageSize: PAGE_SIZE, hasMore: false };
  }
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolved = await searchParams;
  const data = await getArticles(resolved);

  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-16 w-full max-w-xl bg-zinc-900/50 rounded-xl animate-pulse" />
          <div className="h-8 w-48 bg-zinc-900/50 rounded animate-pulse" />
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-zinc-900/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      }
    >
      <ArticlesClient {...data} />
    </Suspense>
  );
}
