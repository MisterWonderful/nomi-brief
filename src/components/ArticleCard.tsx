"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock } from "lucide-react";
import { formatDistanceToNow, isToday, isYesterday } from "date-fns";
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
  publishedAt: Date | string;
  isRead?: boolean;
  isFavorite?: boolean;
}

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const [imgError, setImgError] = useState(false);
  const pubDate = new Date(article.publishedAt);
  const timeAgo = formatDistanceToNow(pubDate, { addSuffix: true });
  const showTodayBadge = isToday(pubDate);
  const showYesterdayBadge = isYesterday(pubDate);

  return (
    <Link href={`/articles/${article.id}`} className="group block">
      <article className="flex gap-3 p-3 rounded-xl bg-[#111111] border border-[#1c1c1c] hover:border-[#2c2c2c] transition-all duration-200">
        {/* Left: Cover image */}
        <div className="relative w-[72px] h-[72px] flex-shrink-0 rounded-lg overflow-hidden bg-[#141414] border border-[#1c1c1c]">
          {article.coverImage && !imgError ? (
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 "
              sizes="72px"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-[9px] font-medium text-[#525252] uppercase tracking-widest text-center leading-tight px-1">
                {article.category}
              </span>
            </div>
          )}
        </div>

        {/* Right: Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 gap-1">
          {/* Top row: category + badges */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium text-[#525252] uppercase tracking-wide">
              {article.category}
            </span>
            {showTodayBadge && (
              <span className="text-[9px] font-medium text-[#4ade80]">new</span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-[13px] font-medium text-[#e5e5e5] leading-snug line-clamp-2 group-hover:text-[#4ade80] transition-colors pr-1">
            {article.title}
          </h3>

          {/* Subtitle */}
          {article.subtitle && article.subtitle.length > 10 && (
            <p className="text-[11px] text-[#525252] line-clamp-1 leading-relaxed">
              {article.subtitle}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-x-1.5 text-[10px] text-[#525252]">
            <span>{timeAgo}</span>
            <span>·</span>
            <Clock className="w-2.5 h-2.5 flex-shrink-0" />
            <span>{article.readTime}m</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
