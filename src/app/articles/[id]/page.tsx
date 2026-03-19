import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Clock, Star, Mic, Calendar, Tag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

async function getArticle(id: string) {
  try {
    const article = await prisma.article.findUnique({
      where: { id },
    });
    return article;
  } catch (error) {
    console.error("Error fetching article:", error);
    return null;
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { id } = await params;
  const article = await getArticle(id);

  if (!article) {
    notFound();
  }

  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Back Button */}
      <Link href="/articles">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Articles
        </Button>
      </Link>

      {/* Cover Image */}
      {article.coverImage && (
        <div className="relative h-80 rounded-2xl overflow-hidden">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
        </div>
      )}

      {/* Article Header */}
      <div className="space-y-6">
        {/* Category Badge */}
        <span className="px-3 py-1.5 text-xs font-medium bg-violet-500/90 text-white rounded-full inline-block">
          {article.category}
        </span>

        {/* Title */}
        <h1 className="text-4xl font-bold text-white font-display leading-tight">
          {article.title}
        </h1>

        {/* Subtitle */}
        {article.subtitle && (
          <p className="text-xl text-zinc-400 leading-relaxed">
            {article.subtitle}
          </p>
        )}

        {/* Meta Row */}
        <div className="flex items-center flex-wrap gap-4 py-4 border-y border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-medium">
              {article.authorName.charAt(0)}
            </div>
            <span className="text-white font-medium">{article.authorName}</span>
          </div>
          <div className="flex items-center gap-1 text-zinc-500">
            <Calendar className="w-4 h-4" />
            <span>{timeAgo}</span>
          </div>
          <div className="flex items-center gap-1 text-zinc-500">
            <Clock className="w-4 h-4" />
            <span>{article.readTime} min read</span>
          </div>
          {article.isFavorite && (
            <div className="flex items-center gap-1 text-yellow-400">
              <Star className="w-4 h-4 fill-current" />
              <span>Favorite</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="w-4 h-4 text-zinc-500" />
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 text-xs font-medium bg-zinc-800 text-zinc-300 rounded-lg"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Article Content */}
      <article className="prose prose-invert prose-zinc max-w-none">
        <div className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
          {article.content}
        </div>
      </article>

      {/* Actions */}
      <div className="flex items-center justify-between pt-8 border-t border-zinc-800">
        <div className="flex items-center gap-3">
          <Button variant="secondary" disabled title="Voice feature coming soon">
            <Mic className="w-4 h-4 mr-2" />
            Talk about this
          </Button>
          <Button variant="ghost">
            <Star className="w-4 h-4 mr-2" />
            {article.isFavorite ? "Unfavorite" : "Favorite"}
          </Button>
        </div>
        <Link href="/articles">
          <Button variant="ghost">
            ← Back to Articles
          </Button>
        </Link>
      </div>
    </div>
  );
}
