"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock, Bookmark } from "lucide-react";
import { formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { useState } from "react";
import { SaveToListModal } from "./lists/SaveToListModal";

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

const CATEGORY_COLORS: Record<string, string> = {
  "Industry":        "text-amber-400/70",
  "Technical":       "text-violet-400/70",
  "Safety & Policy": "text-emerald-400/70",
  "Academic":        "text-blue-400/70",
  "AI & Technology": "text-violet-400/70",
  "Development":     "text-green-400/70",
  "Infrastructure":  "text-zinc-400/70",
  "General":         "text-zinc-400/70",
};

const CATEGORY_BG: Record<string, string> = {
  "Industry":        "bg-amber-500/10 text-amber-400/80",
  "Technical":       "bg-violet-500/10 text-violet-400/80",
  "Safety & Policy": "bg-emerald-500/10 text-emerald-400/80",
  "Academic":        "bg-blue-500/10 text-blue-400/80",
  "AI & Technology": "bg-violet-500/10 text-violet-400/80",
  "Development":     "bg-green-500/10 text-green-400/80",
  "Infrastructure":  "bg-zinc-500/10 text-zinc-400/80",
  "General":         "bg-zinc-500/10 text-zinc-400/80",
};

export function ArticleCard({ article }: ArticleCardProps) {
  const [imgError, setImgError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const pubDate = new Date(article.publishedAt);
  const timeAgo = formatDistanceToNow(pubDate, { addSuffix: true });
  const today = isToday(pubDate);
  const yesterday = isYesterday(pubDate);
  const catColor = CATEGORY_BG[article.category] ?? "bg-zinc-500/10 text-zinc-400/80";

  return (
    <>
      <article className="group flex gap-3.5 p-3 rounded-lg border border-transparent hover:border-zinc-700/50 hover:bg-zinc-900/40 transition-all duration-150 cursor-pointer">
        {/* Cover image — square, tight */}
        <div className="relative w-[72px] h-[72px] flex-shrink-0 rounded-md overflow-hidden bg-zinc-900">
          {article.coverImage && !imgError ? (
            <Image
              src={article.coverImage}
              alt=""
              fill
              className="object-cover"
              sizes="72px"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
              <span className="text-[9px] font-semibold text-zinc-600 uppercase tracking-widest text-center px-1 leading-tight">
                {article.category}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between gap-1">
          {/* Top */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* Category + time row */}
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`text-[10px] font-medium px-1.5 py-px rounded-md ${catColor}`}>
                  {article.category}
                </span>
                {today && (
                  <span className="text-[10px] font-medium text-emerald-400/80">New</span>
                )}
                {yesterday && (
                  <span className="text-[10px] text-zinc-600">Yesterday</span>
                )}
              </div>
              {/* Title */}
              <Link href={`/articles/${article.id}`} className="block">
                <h3 className="text-[13px] font-medium text-white leading-snug line-clamp-2 group-hover:text-violet-300 transition-colors">
                  {article.title}
                </h3>
              </Link>
            </div>
          </div>

          {/* Bottom row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-1.5 text-[11px] text-zinc-500">
              <span>{timeAgo}</span>
              <span className="text-zinc-700">·</span>
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span>{article.readTime}m</span>
            </div>
            <button
              onClick={(e) => { e.preventDefault(); setShowModal(true); }}
              className="p-1 rounded text-zinc-600 hover:text-violet-400 transition-colors"
              title="Save to list"
            >
              <Bookmark className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </article>

      <SaveToListModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        item={{
          title: article.title,
          description: article.subtitle || undefined,
          url: `/articles/${article.id}`,
          image: article.coverImage || undefined,
          tags: article.tags,
        }}
      />
    </>
  );
}
