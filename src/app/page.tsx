import { ArticleCard } from "@/components/ArticleCard";
import { Button } from "@/components/ui/Button";
import { Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { HomeSortNav } from "@/components/search/HomeSortNav";
import { Suspense } from "react";

// Force dynamic rendering to avoid SSR issues with framer-motion
export const dynamic = "force-dynamic";

// Fallback mock data for when database is unavailable
const fallbackArticles = [
  {
    id: "fallback-1",
    title: "Welcome to Nomi Brief",
    subtitle: "Your AI-curated news and insights platform",
    content: "",
    authorName: "Nomi Vale",
    category: "Welcome",
    tags: ["Nomi Brief", "Getting Started"],
    readTime: 2,
    publishedAt: new Date(),
    coverImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=80",
    isFavorite: false,
    isRead: false,
  },
];

async function getDefaultUser() {
  const userEmail = process.env.DEFAULT_USER_EMAIL || "nomi@nomibrief.app";
  return prisma.user.findUnique({ where: { email: userEmail } });
}

async function getHomePageData(sort: string) {
  try {
    const user = await getDefaultUser();

    if (!user) {
      return { articles: fallbackArticles, stats: null };
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const orderBy =
      sort === "recent"
        ? { publishedAt: "asc" as const }
        : sort === "favorites"
          ? { isFavorite: "desc" as const }
          : { publishedAt: "desc" as const };

    const [articles, articleCount, linkCount, todayArticles, totalReadingMinutes] = await Promise.all([
      prisma.article.findMany({
        where: { userId: user.id, isPublished: true },
        orderBy,
        take: 10,
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
      // Total published articles
      prisma.article.count({ where: { userId: user.id, isPublished: true } }),
      // Total links
      prisma.linkEntry.count({ where: { userId: user.id } }),
      // Articles published today
      prisma.article.count({
        where: { userId: user.id, isPublished: true, publishedAt: { gte: startOfDay } },
      }),
      // Total reading time from today's articles
      prisma.article.aggregate({
        where: { userId: user.id, isPublished: true, publishedAt: { gte: startOfDay } },
        _sum: { readTime: true },
      }),
    ]);

    const stats = {
      articleCount,
      linkCount,
      todayArticles,
      totalReadingMinutes: totalReadingMinutes._sum.readTime || 0,
    };

    return { articles: articles.length > 0 ? articles : fallbackArticles, stats, user };
  } catch (error) {
    console.error("Error fetching home page data:", error);
    return { articles: fallbackArticles, stats: null };
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const { articles, stats, user } = await getHomePageData(sort || "trending");

  // Determine greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  const userName = user?.name || "Ryan";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white font-display leading-tight">
            {greeting},{" "}
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              {userName}
            </span>
          </h1>
          <p className="mt-1.5 text-sm text-zinc-400 md:text-base">
            Your AI-curated news and insights are ready
          </p>
        </div>
        <div className="flex justify-start">
          <Button
            variant="primary"
            size="sm"
            className="text-xs sm:text-sm"
            disabled
            title="Feature coming soon"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
            Generate Brief
          </Button>
        </div>
      </div>

      {/* Stats — 2 cols on mobile, 4 on desktop */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
          <div className="glass rounded-xl sm:rounded-2xl p-3 sm:p-5 md:p-6">
            <p className="text-[10px] sm:text-xs text-zinc-500">Articles</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white mt-0.5">{stats.articleCount}</p>
            <p className="text-[10px] sm:text-xs text-violet-400 mt-0.5">
              {stats.todayArticles > 0 ? `+${stats.todayArticles} today` : "No new today"}
            </p>
          </div>
          <div className="glass rounded-xl sm:rounded-2xl p-3 sm:p-5 md:p-6">
            <p className="text-[10px] sm:text-xs text-zinc-500">Links</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white mt-0.5">{stats.linkCount}</p>
            <p className="text-[10px] sm:text-xs text-zinc-600 mt-0.5">Saved</p>
          </div>
          <div className="glass rounded-xl sm:rounded-2xl p-3 sm:p-5 md:p-6">
            <p className="text-[10px] sm:text-xs text-zinc-500">Reading</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white mt-0.5">
              {stats.totalReadingMinutes > 0
                ? stats.totalReadingMinutes >= 60
                  ? `${(stats.totalReadingMinutes / 60).toFixed(1)}h`
                  : `${stats.totalReadingMinutes}m`
                : "0m"}
            </p>
            <p className="text-[10px] sm:text-xs text-zinc-600 mt-0.5">Today</p>
          </div>
          <div className="glass rounded-xl sm:rounded-2xl p-3 sm:p-5 md:p-6">
            <p className="text-[10px] sm:text-xs text-zinc-500">Topics</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white mt-0.5">
              {[...new Set(articles.map((a: any) => a.category))].length || 1}
            </p>
            <p className="text-[10px] sm:text-xs text-zinc-600 mt-0.5">Active</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <Suspense fallback={<div className="h-8 w-48 bg-zinc-900/50 rounded-lg animate-pulse" />}>
          <HomeSortNav />
        </Suspense>
        <div className="h-px bg-zinc-800/60" />
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex items-center gap-2 min-w-max">
            <span className="text-[10px] text-zinc-600 uppercase tracking-wider flex-shrink-0">Category</span>
            <div className="h-4 w-px bg-zinc-800 flex-shrink-0" />
            <Button variant="secondary" size="sm" className="text-[10px] px-2.5 py-1 flex-shrink-0">
              All
            </Button>
            {["AI & Technology", "Infrastructure", "Development", "Research"].map((cat) => (
              <Button key={cat} variant="ghost" size="sm" disabled className="text-[10px] px-2.5 py-1 flex-shrink-0">
                {cat}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Article Grid */}
      <div className="grid gap-6">
        {articles.length > 0 ? (
          articles.map((article: any, index: number) => (
            <div key={article.id}>
              <ArticleCard article={article} featured={index === 0} />
            </div>
          ))
        ) : (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-zinc-400 text-lg">No articles yet</p>
            <p className="text-zinc-600 text-sm mt-2">
              Configure the OpenClaw webhook to receive AI-generated articles
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
