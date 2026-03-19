import { ArticleCard } from "@/components/ArticleCard";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { Search, Filter } from "lucide-react";

// Force dynamic rendering to avoid SSR issues with framer-motion
export const dynamic = "force-dynamic";

async function getArticles() {
  try {
    const articles = await prisma.article.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
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
    return [];
  }
}

export default async function ArticlesPage() {
  const articles = await getArticles();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white font-display">
            All Articles
          </h1>
          <p className="mt-2 text-zinc-400">
            {articles.length} articles in your library
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm">
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
          <Button variant="ghost" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Articles Grid */}
      {articles.length > 0 ? (
        <div className="grid gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-zinc-400 text-lg">No articles yet</p>
          <p className="text-zinc-600 text-sm mt-2">
            Configure the OpenClaw webhook to receive AI-generated articles
          </p>
        </div>
      )}
    </div>
  );
}
