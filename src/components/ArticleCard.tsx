"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Clock, Star, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

interface Article {
  id: string;
  title: string;
  subtitle?: string | null;
  authorName: string;
  authorAvatar?: string | null;
  coverImage?: string | null;
  category: string;
  tags?: string[];
  readTime: number;
  publishedAt: Date;
  isRead?: boolean;
  isFavorite?: boolean;
}

interface ArticleCardProps {
  article: Article;
  featured?: boolean;
}

export function ArticleCard({ article, featured = false }: ArticleCardProps) {
  const router = useRouter();
  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${article.title.slice(0, 40)}..."?`)) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/articles/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: article.id }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to delete article");
        setDeleting(false);
      }
    } catch {
      alert("Failed to delete article");
      setDeleting(false);
    }
  }

  if (deleting) return null;

  if (featured) {
    return (
      <Link href={`/articles/${article.id}`} className="group block">
        {/* Cover Image */}
        {article.coverImage && (
          <div className="relative aspect-[16/9] sm:aspect-[2.4/1] rounded-xl sm:rounded-2xl overflow-hidden mb-3 sm:mb-4">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              priority
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/30 to-transparent" />

            {/* Category badge */}
            <span className="absolute top-3 left-3 sm:top-4 sm:left-4 px-2.5 py-1 text-[10px] sm:text-xs font-semibold bg-violet-500/90 text-white rounded-full backdrop-blur-sm">
              {article.category}
            </span>

            {/* Favorite */}
            {article.isFavorite && (
              <span className="absolute top-3 right-3 sm:top-4 sm:right-4">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              </span>
            )}

            {/* Title overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5">
              <h2 className="text-base sm:text-xl md:text-2xl font-bold text-white font-display leading-tight line-clamp-2 sm:line-clamp-3">
                {article.title}
              </h2>
              {article.subtitle && (
                <p className="hidden sm:block mt-1 text-xs sm:text-sm text-zinc-300 line-clamp-1">
                  {article.subtitle}
                </p>
              )}
            </div>
          </div>
        )}

        {/* No-image featured layout */}
        {!article.coverImage && (
          <div className="rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-violet-900/40 to-purple-900/30 border border-violet-500/20 p-4 sm:p-6 mb-3 sm:mb-4">
            <span className="inline-block px-2.5 py-1 text-[10px] sm:text-xs font-semibold bg-violet-500/20 text-violet-300 rounded-full mb-2 sm:mb-3">
              {article.category}
            </span>
            <h2 className="text-base sm:text-xl md:text-2xl font-bold text-white font-display leading-tight">
              {article.title}
            </h2>
            {article.subtitle && (
              <p className="hidden sm:block mt-2 text-sm text-zinc-400 line-clamp-2">
                {article.subtitle}
              </p>
            )}
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-zinc-500 flex-wrap">
          <span className="text-zinc-400 font-medium">{article.authorName}</span>
          <span>·</span>
          <span>{timeAgo}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {article.readTime}m
          </span>
          {article.isFavorite && (
            <>
              <span>·</span>
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            </>
          )}
        </div>
      </Link>
    );
  }

  // Standard card — horizontal on desktop, vertical on mobile
  return (
    <Link href={`/articles/${article.id}`} className="group block">
      <article className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl glass hover:glow-hover transition-all duration-200">
        {/* Cover image — small square on left */}
        {article.coverImage ? (
          <div className="hidden sm:block relative w-24 lg:w-32 flex-shrink-0 rounded-xl overflow-hidden">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            />
            {/* Category overlay */}
            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[9px] font-semibold bg-black/70 text-white rounded-md">
              {article.category}
            </span>
          </div>
        ) : (
          <div className="hidden sm:flex w-24 lg:w-32 flex-shrink-0 rounded-xl bg-gradient-to-br from-violet-900/50 to-purple-900/30 items-center justify-center flex-shrink-0">
            <span className="text-[10px] text-violet-400/60 font-medium px-2 text-center">{article.category}</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5 sm:gap-2">
          {/* Mobile: category above title */}
          <div className="flex items-center gap-2 sm:hidden">
            <span className="text-[10px] font-medium text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">
              {article.category}
            </span>
            {article.isFavorite && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
          </div>

          <div>
            <h3 className="text-sm sm:text-base font-semibold text-white leading-snug line-clamp-2 group-hover:text-violet-300 transition-colors">
              {article.title}
            </h3>
            {article.subtitle && (
              <p className="hidden md:block mt-1 text-xs text-zinc-500 line-clamp-1">
                {article.subtitle}
              </p>
            )}
          </div>

          {/* Tags on mobile */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide sm:hidden">
              {article.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] text-zinc-600 bg-zinc-800/60 px-1.5 py-0.5 rounded-md whitespace-nowrap"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-x-2 text-[10px] sm:text-xs text-zinc-500">
            <span className="text-zinc-400 font-medium truncate max-w-[80px] sm:max-w-none">
              {article.authorName}
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">{timeAgo}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 flex-shrink-0" />
              {article.readTime}m
            </span>
            {article.isFavorite && (
              <>
                <span>·</span>
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 flex-shrink-0" />
              </>
            )}
            {/* Delete button */}
            <span className="ml-auto">
              <button
                onClick={handleDelete}
                className="p-1 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Delete article"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
