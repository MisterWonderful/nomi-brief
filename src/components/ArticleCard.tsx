"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
  publishedAt: Date | string;
  isRead?: boolean;
  isFavorite?: boolean;
}

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });

  return (
    <Link href={`/articles/${article.id}`} className="group block">
      <article className="flex gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl glass hover:glow-hover transition-all duration-200">
        {/* Left: Cover image or gradient fallback */}
        <div className="relative w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] flex-shrink-0 rounded-lg sm:rounded-xl overflow-hidden">
          {article.coverImage ? (
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.06]"
              sizes="120px"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-900/60 to-purple-900/40 flex items-center justify-center">
              <span className="text-[10px] text-violet-400/60 font-medium px-2 text-center leading-tight">
                {article.category}
              </span>
            </div>
          )}
        </div>

        {/* Right: Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            {/* Category badge */}
            <span className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-violet-500/15 text-violet-400 rounded-full mb-1.5">
              {article.category}
            </span>

            {/* Title */}
            <h3 className="text-sm sm:text-base font-bold text-white leading-snug line-clamp-2 group-hover:text-violet-300 transition-colors">
              {article.title}
            </h3>

            {/* TLDR / Subtitle */}
            {article.subtitle && (
              <p className="mt-1 text-xs sm:text-sm text-zinc-400 line-clamp-2 leading-relaxed">
                {article.subtitle}
              </p>
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-x-2 text-[10px] sm:text-xs text-zinc-500 mt-2">
            <span className="text-zinc-400 font-medium truncate max-w-[100px] sm:max-w-[140px]">
              {article.authorName}
            </span>
            <span>·</span>
            <span>{timeAgo}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 flex-shrink-0" />
              {article.readTime}m
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
