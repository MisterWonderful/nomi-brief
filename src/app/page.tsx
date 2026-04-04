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
      prisma.article.count({ where: { userId: user.id, isPublished: true, publishedAt: { gte: startOfDay } } }),
      prisma.article.count({ where: { userId: user.id, isPublished: true } }),
    ]);
    return { todayCount, totalCount };
  } catch { return { todayCount: 0, totalCount: 0 }; }
}

export default async function HomePage() {
  const { todayCount, totalCount } = await getHomeStats();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1c1c1c] border border-[#222222] flex items-center justify-center">
            <Newspaper className="w-4 h-4 text-[#525252]" />
          </div>
          <div>
            <h1 className="text-[15px] font-medium text-[#e5e5e5] leading-none">{greeting}, Ryan</h1>
            <p className="text-[11px] text-[#525252] mt-0.5 leading-none">
              {todayCount > 0 ? `${todayCount} new article${todayCount !== 1 ? "s" : ""} today` : "No new articles today"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#111111] border border-[#1c1c1c]">
          <span className="text-[11px] text-[#525252]">Total</span>
          <span className="text-[11px] font-semibold text-[#737373]">{totalCount}</span>
        </div>
      </div>
      <ArticleFeed />
    </div>
  );
}
