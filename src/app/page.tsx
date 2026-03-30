import { ArticleFeed } from "@/components/ArticleFeed";
import { prisma } from "@/lib/prisma";
import { Newspaper } from "lucide-react";

export const dynamic = "force-dynamic";

async function getDefaultUser() {
  const userEmail = process.env.DEFAULT_USER_EMAIL || "nomi@nomibrief.app";
  return prisma.user.findUnique({ where: { email: userEmail } });
}

async function getHomeStats() {
  try {
    const user = await getDefaultUser();
    if (!user) return { todayCount: 0, totalCount: 0 };

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    const [todayCount, totalCount] = await Promise.all([
      prisma.article.count({
        where: { userId: user.id, isPublished: true, publishedAt: { gte: startOfDay } },
      }),
      prisma.article.count({ where: { userId: user.id, isPublished: true } }),
    ]);

    return { todayCount, totalCount };
  } catch {
    return { todayCount: 0, totalCount: 0 };
  }
}

export default async function HomePage() {
  const { todayCount, totalCount } = await getHomeStats();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <Newspaper className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-white leading-none">{greeting}, Ryan</h1>
            <p className="text-[11px] text-zinc-500 mt-0.5 leading-none">
              {todayCount > 0
                ? `${todayCount} new article${todayCount !== 1 ? "s" : ""} today`
                : "No new articles today"}
            </p>
          </div>
        </div>

        {/* Minimal stats pill */}
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-900/60 border border-zinc-800/60">
          <span className="text-[11px] text-zinc-500">Total</span>
          <span className="text-[11px] font-semibold text-zinc-300">{totalCount}</span>
        </div>
      </div>

      {/* Article Feed */}
      <ArticleFeed />
    </div>
  );
}
