import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Clock, Star, Bookmark, ArrowRight, Mic } from "lucide-react";

// Relaxed type for ArticleCard - only requires fields it actually renders
interface ArticleCardData {
  id: string;
  title: string;
  subtitle?: string | null;
  coverImage?: string | null;
  category: string;
  tags: string[];
  readTime: number;
  publishedAt: Date | string;
  isFavorite: boolean;
  isRead?: boolean;
  authorName: string;
}

interface ArticleCardProps {
  article: ArticleCardData;
  featured?: boolean;
}

export function ArticleCard({ article, featured = false }: ArticleCardProps) {
  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });

  if (featured) {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
      >
        <Link href={`/articles/${article.id}`} className="block group">
          <article className="glass rounded-3xl overflow-hidden hover:glow-hover transition-all duration-300">
            {/* Cover Image */}
            <div className="relative h-80 overflow-hidden">
              <Image
                src={article.coverImage || "https://picsum.photos/1200/600"}
                alt={article.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
              
              {/* Category Badge */}
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1.5 text-xs font-medium bg-violet-500/90 text-white rounded-full backdrop-blur-sm">
                  {article.category}
                </span>
              </div>
              
              {/* Favorite */}
              {article.isFavorite && (
                <div className="absolute top-4 right-4">
                  <div className="p-2 rounded-full bg-yellow-500/90 backdrop-blur-sm">
                    <Star className="w-4 h-4 text-white fill-current" />
                  </div>
                </div>
              )}
              
              {/* Title Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h2 className="text-3xl font-bold text-white mb-2 font-display leading-tight">
                  {article.title}
                </h2>
                <p className="text-zinc-300 text-lg line-clamp-2">
                  {article.subtitle}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              {/* Meta */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                    {article.authorName.charAt(0)}
                  </div>
                  <span className="text-sm text-zinc-300">{article.authorName}</span>
                </div>
                <span className="text-zinc-600">•</span>
                <div className="flex items-center gap-1 text-zinc-500 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{article.readTime} min read</span>
                </div>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-500 text-sm">{timeAgo}</span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 text-xs font-medium bg-zinc-800 text-zinc-300 rounded-lg"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                <div className="flex items-center gap-2">
                  <button 
                    disabled
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800/50 text-zinc-500 cursor-not-allowed"
                    title="Voice feature coming soon"
                  >
                    <Mic className="w-4 h-4" />
                    <span className="text-sm font-medium">Coming soon</span>
                  </button>
                  <button className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors">
                    <Bookmark className="w-5 h-5" />
                  </button>
                </div>
                <span className="flex items-center gap-2 text-sm font-medium text-violet-400 group-hover:gap-3 transition-all">
                  Read Article
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </article>
        </Link>
      </motion.div>
    );
  }

  // Standard card
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/articles/${article.id}`} className="block group">
        <article className="glass rounded-2xl overflow-hidden hover:glow-hover transition-all duration-300 flex">
          {/* Cover Image */}
          <div className="relative w-64 h-48 flex-shrink-0 overflow-hidden">
            <Image
              src={article.coverImage || "https://picsum.photos/400/300"}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-950/80" />
          </div>

          {/* Content */}
          <div className="flex-1 p-6 flex flex-col">
            {/* Category & Time */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-medium text-violet-400">{article.category}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-xs text-zinc-500">{timeAgo}</span>
              {article.isFavorite && (
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
              )}
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-violet-300 transition-colors line-clamp-1">
              {article.title}
            </h3>

            {/* Subtitle */}
            <p className="text-zinc-400 text-sm line-clamp-2 flex-1">
              {article.subtitle}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800/50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                  {article.authorName.charAt(0)}
                </div>
                <span className="text-xs text-zinc-500">{article.readTime} min read</span>
              </div>
              <button 
                disabled
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/50 text-zinc-500 text-xs font-medium cursor-not-allowed"
                title="Voice feature coming soon"
              >
                <Mic className="w-3.5 h-3.5" />
                Soon
              </button>
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}
