import { ArticleFeed } from "@/components/ArticleFeed";
import { Button } from "@/components/ui/Button";
import { Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering to avoid stale data
export const dynamic = "force-dynamic";

async function getDefaultUser() {
  const userEmail = process.env.DEFAULT_USER_EMAIL || "nomi@nomibrief.app";
  return prisma.user.findUnique({ where: { email: userEmail } });
}

async function getHomeStats() {
  try {
    const user = await getDefaultUser();
    if (!user) return { stats: null, userName: "Ryan" };

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [articleCount, linkCount, todayArticles, totalReadingMinutes, categories] =
      await Promise.all([
        prisma.article.count({ where: { userId: user.id, isPublished: true } }),
        prisma.linkEntry.count({ where: { userId: user.id } }),
        prisma.article.count({
          where: { userId: user.id, isPublished: true, publishedAt: { gte: startOfDay } },
        }),
        prisma.article.aggregate({
          where: { userId: user.id, isPublished: true, publishedAt: { gte: startOfDay } },
          _sum: { readTime: true },
        }),
        prisma.article.findMany({
          where: { userId: user.id, isPublished: true },
          select: { category: true },
          distinct: ["category"],
        }),
      ]);

    const stats = {
      articleCount,
      linkCount,
      todayArticles,
      totalReadingMinutes: totalReadingMinutes._sum.readTime || 0,
      topicCount: categories.length || 1,
    };

    return { stats, userName: user.name || "Ryan" };
  } catch (error) {
    console.error("Error fetching home stats:", error);
    return { stats: null, userName: "Ryan" };
  }
}

export default async function HomePage() {
  const { stats, userName } = await getHomeStats();

  // Determine greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

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
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white mt-0.5">
              {stats.articleCount}
            </p>
            <p className="text-[10px] sm:text-xs text-violet-400 mt-0.5">
              {stats.todayArticles > 0 ? `+${stats.todayArticles} today` : "No new today"}
            </p>
          </div>
          <div className="glass rounded-xl sm:rounded-2xl p-3 sm:p-5 md:p-6">
            <p className="text-[10px] sm:text-xs text-zinc-500">Links</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white mt-0.5">
              {stats.linkCount}
            </p>
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
              {stats.topicCount}
            </p>
            <p className="text-[10px] sm:text-xs text-zinc-600 mt-0.5">Active</p>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-zinc-800/60" />

      {/* Article Feed with infinite scroll */}
      <ArticleFeed />
    </div>
  );
}
