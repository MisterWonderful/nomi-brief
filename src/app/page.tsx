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
    <div className="space-y-1">
      {/* Minimal header */}
      <div className="flex items-center justify-between px-1 py-3">
        <div className="flex items-center gap-2.5">
          <Newspaper className="w-4 h-4 text-zinc-500" />
          <div>
            <h1 className="text-sm font-medium text-white leading-none">{greeting}</h1>
            {todayCount > 0 ? (
              <p className="text-[11px] text-emerald-400/70 mt-0.5 leading-none">
                {todayCount} new article{todayCount !== 1 ? "s" : ""} today
              </p>
            ) : (
              <p className="text-[11px] text-zinc-600 mt-0.5 leading-none">No new articles</p>
            )}
          </div>
        </div>
        {totalCount > 0 && (
          <span className="text-[11px] text-zinc-600">
            {totalCount} total
          </span>
        )}
      </div>

      {/* Article Feed */}
      <ArticleFeed />
    </div>
  );
}
