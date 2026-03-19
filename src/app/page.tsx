import { ArticleCard } from "@/components/ArticleCard";
import { Button } from "@/components/ui/Button";
import { Sparkles, TrendingUp, Clock, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";

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

async function getArticles() {
  try {
    const articles = await prisma.article.findMany({
      where: { isPublished: true },
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
    });
    return articles;
  } catch (error) {
    console.error("Error fetching articles:", error);
    return fallbackArticles;
  }
}

export default async function HomePage() {
  const articles = await getArticles();

  const categories = ["All", "AI & Technology", "Infrastructure", "Development", "Research"];
  const filters = [
    { icon: TrendingUp, label: "Trending" },
    { icon: Clock, label: "Recent" },
    { icon: Star, label: "Favorites" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white font-display">
            Good Evening, <span className="gradient-text">Ryan</span>
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

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Articles", value: articles.length.toString(), change: "+5 today" },
          { label: "Links Saved", value: "156", change: "+12 today" },
          { label: "Voice Sessions", value: "8", change: "This week" },
          { label: "Reading Time", value: "3.2h", change: "Today" },
        ].map((stat) => (
          <div 
            key={stat.label}
            className="glass rounded-2xl p-6 hover:glow-hover transition-all duration-300"
          >
            <p className="text-sm text-zinc-500">{stat.label}</p>
            <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
            <p className="text-xs text-violet-400 mt-1">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-1">
          {filters.map((filter) => {
            const Icon = filter.icon;
            return (
              <Button
                key={filter.label}
                variant={filter.label === "Trending" ? "primary" : "ghost"}
                size="sm"
              >
                <Icon className="w-4 h-4 mr-2" />
                {filter.label}
              </Button>
            );
          })}
        </div>
        <div className="h-6 w-px bg-zinc-800" />
        <div className="flex items-center gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={category === "All" ? "secondary" : "ghost"}
              size="sm"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Article Grid */}
      <div className="grid gap-6">
        {articles.length > 0 ? (
          articles.map((article, index) => (
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
