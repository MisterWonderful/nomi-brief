import { ArticleCard } from "@/components/ArticleCard";
import { Button } from "@/components/ui/Button";
import { Sparkles, TrendingUp, Clock, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getInitials } from "@/lib/utils";

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

async function getHomePageData() {
  try {
    const user = await getDefaultUser();

    if (!user) {
      return { articles: fallbackArticles, stats: null };
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const [articles, articleCount, linkCount, todayArticles, totalReadingMinutes] = await Promise.all([
      prisma.article.findMany({
        where: { userId: user.id, isPublished: true },
        orderBy: { publishedAt: "desc" },
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

export default async function HomePage() {
  const { articles, stats, user } = await getHomePageData();

  // Determine greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  const userName = user?.name || "Ryan";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white font-display">
            {greeting}, <span className="gradient-text">{userName}</span>
          </h1>
          <p className="mt-2 text-zinc-400">
            Your AI-curated news and insights are ready
          </p>
        </div>
        <Button variant="primary" size="lg" disabled title="Feature coming soon">
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Brief
        </Button>
      </div>

      {/* Stats — only render if we have real data */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="glass rounded-2xl p-6 hover:glow-hover transition-all duration-300">
            <p className="text-sm text-zinc-500">Articles</p>
            <p className="text-3xl font-bold text-white mt-1">{stats.articleCount}</p>
            <p className="text-xs text-violet-400 mt-1">
              {stats.todayArticles > 0 ? `+${stats.todayArticles} today` : "No new articles today"}
            </p>
          </div>
          <div className="glass rounded-2xl p-6 hover:glow-hover transition-all duration-300">
            <p className="text-sm text-zinc-500">Links Saved</p>
            <p className="text-3xl font-bold text-white mt-1">{stats.linkCount}</p>
            <p className="text-xs text-zinc-600 mt-1">From articles &amp; bookmarks</p>
          </div>
          <div className="glass rounded-2xl p-6 hover:glow-hover transition-all duration-300">
            <p className="text-sm text-zinc-500">Reading Time</p>
            <p className="text-3xl font-bold text-white mt-1">
              {stats.totalReadingMinutes > 0
                ? stats.totalReadingMinutes >= 60
                  ? `${(stats.totalReadingMinutes / 60).toFixed(1)}h`
                  : `${stats.totalReadingMinutes}m`
                : "0m"}
            </p>
            <p className="text-xs text-zinc-600 mt-1">Today&apos;s articles</p>
          </div>
          <div className="glass rounded-2xl p-6 hover:glow-hover transition-all duration-300">
            <p className="text-sm text-zinc-500">Categories</p>
            <p className="text-3xl font-bold text-white mt-1">
              {[...new Set(articles.map((a: any) => a.category))].length || 1}
            </p>
            <p className="text-xs text-zinc-600 mt-1">Active topics</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-1">
          {[
            { icon: TrendingUp, label: "Trending" },
            { icon: Clock, label: "Recent" },
            { icon: Star, label: "Favorites" },
          ].map((filter) => {
            const Icon = filter.icon;
            return (
              <Button
                key={filter.label}
                variant={filter.label === "Trending" ? "primary" : "ghost"}
                size="sm"
                disabled={filter.label !== "Recent"}
                title={filter.label !== "Recent" ? "Coming soon" : undefined}
              >
                <Icon className="w-4 h-4 mr-2" />
                {filter.label}
              </Button>
            );
          })}
        </div>
        <div className="h-6 w-px bg-zinc-800" />
        <div className="flex items-center gap-2">
          {["All", "AI & Technology", "Infrastructure", "Development", "Research"].map(
            (category) => (
              <Button
                key={category}
                variant={category === "All" ? "secondary" : "ghost"}
                size="sm"
                disabled
                title="Coming soon"
              >
                {category}
              </Button>
            )
          )}
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
