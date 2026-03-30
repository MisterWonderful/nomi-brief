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

const CATEGORY_GRADIENTS: Record<string, string> = {
  "Industry":       "from-amber-900/70 to-orange-900/50",
  "Technical":      "from-violet-900/70 to-purple-900/50",
  "Safety & Policy": "from-emerald-900/70 to-teal-900/50",
  "Academic":       "from-blue-900/70 to-cyan-900/50",
  "AI & Technology":"from-violet-900/70 to-fuchsia-900/50",
  "Development":    "from-green-900/70 to-emerald-900/50",
  "Infrastructure":"from-slate-800/80 to-zinc-800/60",
  "General":        "from-zinc-800/60 to-neutral-800/40",
};

function CategoryGradient({ category }: { category: string }) {
  const grad = CATEGORY_GRADIENTS[category] ?? "from-violet-900/70 to-purple-900/50";
  return (
    <div className={`w-full h-full bg-gradient-to-br ${grad} flex items-center justify-center p-2`}>
      <span className="text-[9px] font-semibold text-white/50 uppercase tracking-widest text-center leading-tight">
        {category}
      </span>
    </div>
  );
}

export function ArticleCard({ article }: ArticleCardProps) {
  const [imgError, setImgError] = useState(false);
  const pubDate = new Date(article.publishedAt);
  const timeAgo = formatDistanceToNow(pubDate, { addSuffix: true });
  const showTodayBadge = isToday(pubDate);
  const showYesterdayBadge = isYesterday(pubDate);

  return (
    <Link href={`/articles/${article.id}`} className="group block">
      <article className="flex gap-3 p-3 rounded-xl glass hover:glow-hover transition-all duration-200">
        {/* Left: Cover image (square) */}
        <div className="relative w-[88px] h-[88px] flex-shrink-0 rounded-lg overflow-hidden bg-zinc-900">
          {article.coverImage && !imgError ? (
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.06]"
              sizes="88px"
              onError={() => setImgError(true)}
            />
          ) : (
            <CategoryGradient category={article.category} />
          )}
        </div>

        {/* Right: Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 gap-1.5">
          {/* Top row: category + badges */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">
              {article.category}
            </span>
            {showTodayBadge && (
              <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-500/20 text-emerald-400 rounded-full">
                New
              </span>
            )}
            {showYesterdayBadge && (
              <span className="px-1.5 py-0.5 text-[9px] font-medium text-amber-400/70 bg-amber-500/10 rounded-full">
                Yesterday
              </span>
            )}
          </div>

          {/* Title — primary focus */}
          <h3 className="text-[13px] sm:text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-violet-300 transition-colors pr-1">
            {article.title}
          </h3>

          {/* TLDR — only show if it's actually meaningful */}
          {article.subtitle && article.subtitle.length > 10 && (
            <p className="text-[11px] sm:text-xs text-zinc-500 line-clamp-1 leading-relaxed">
              {article.subtitle}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-x-1.5 text-[10px] text-zinc-600">
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
