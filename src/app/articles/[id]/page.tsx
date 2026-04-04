import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Clock, Star, Mic, Calendar, Tag, BookOpen, Bookmark } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { preprocessYouTubeUrls } from "@/lib/rehype-youtube";
import { SourceLink, ArticleProgress } from "@/components/article";
import { DigestEntryCard } from "@/components/DigestEntryCard";


const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), "iframe", "div", "span"],
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code || []), "className"],
    span: [...(defaultSchema.attributes?.span || []), "className"],
    pre: [...(defaultSchema.attributes?.pre || []), "className"],
    div: [...(defaultSchema.attributes?.div || []), "className"],
    iframe: [
      ...(defaultSchema.attributes?.iframe || []),
      "src", "frameborder", "allow", "allowfullscreen", "loading", "title",
    ],
  },
};

// Simple regex-based HTML sanitizer (no jsdom/DOMPurify needed for server-side use)
function sanitizeArticleHtml(html: string): string {
  const withEmbeds = html.replace(
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/g,
    '<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:1rem 0;border-radius:0.75rem;"><iframe src="https://www.youtube.com/embed/$1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy" style="position:absolute;top:0;left:0;width:100%;height:100%;"></iframe></div>'
  );
  return withEmbeds
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "");
}

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

async function getArticle(id: string) {
  try {
    return await prisma.article.findUnique({ where: { id } });
  } catch {
    return null;
  }
}

interface DigestEntry {
  title: string;
  description?: string;
  url?: string;
  source?: string;
  date?: string;
  tags?: string[];
  image?: string | null;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article || !article.isPublished) notFound();

  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });

  // Parse structured entries if present (for digest articles)
  let entries: DigestEntry[] = [];
  if (article.entries) {
    try {
      entries = JSON.parse(article.entries) as DigestEntry[];
    } catch {
      entries = [];
    }
  }

  return (
    <>
      <ArticleProgress />

      <div className="space-y-5 sm:space-y-6 max-w-4xl">
        {/* Back */}
        <div className="flex items-center gap-2">
          <Link href="/articles">
            <Button variant="ghost" size="sm" className="text-[#525252] hover:text-[#e5e5e5] text-xs sm:text-sm -ml-2">
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Articles
            </Button>
          </Link>
          <span className="text-[#1c1c1c]">·</span>
          <span className="text-[10px] text-[#525252] uppercase tracking-wide">{article.category}</span>
        </div>

        {/* Cover Image */}
        {article.coverImage && (
          <div className="relative aspect-[16/9] sm:aspect-[2.4/1] rounded-xl overflow-hidden">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Header */}
        <div className="space-y-3 sm:space-y-4">
          {/* Title */}
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#e5e5e5] leading-tight">
            {article.title}
          </h1>

          {/* Subtitle */}
          {article.subtitle && (
            <p className="text-sm sm:text-base md:text-lg text-[#737373] leading-relaxed font-light">
              {article.subtitle}
            </p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3 border-y border-[#1c1c1c]">
            {/* Author */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#1c1c1c] flex items-center justify-center text-[#737373] text-xs font-semibold flex-shrink-0">
                {article.authorName.charAt(0)}
              </div>
              <div>
                <p className="text-[#e5e5e5] text-xs sm:text-sm font-medium leading-none">{article.authorName}</p>
                <p className="text-[#525252] text-[10px] sm:text-xs mt-0.5">{timeAgo}</p>
              </div>
            </div>

            <div className="h-4 w-px bg-[#1c1c1c] hidden sm:block" />

            {/* Read time */}
            <div className="flex items-center gap-1.5 text-[#525252] text-xs sm:text-sm">
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{article.readTime} min read</span>
            </div>

            {article.isFavorite && (
              <div className="flex items-center gap-1.5 text-yellow-400 text-xs sm:text-sm">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                <span>Favorite</span>
              </div>
            )}
          </div>
        </div>

        {/* Article body */}
        <article className="prose prose-invert prose-zinc prose-sm sm:prose-base md:prose-lg max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
          >
            {preprocessYouTubeUrls(article.content)}
          </ReactMarkdown>
        </article>

        {/* Tags at bottom of article content */}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] text-[#525252] bg-[#141414] border border-[#1c1c1c] rounded px-2 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Rich HTML content from agents (YouTube embeds, custom layouts, etc.) */}
        {article.contentHtml && (
          <div
            className="mt-6 p-4 sm:p-6 rounded-xl bg-[#111111] border border-[#1c1c1c]"
            dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(article.contentHtml) }}
          />
        )}

        {/* Digest entries */}
        {entries.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#1c1c1c]" />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[#525252] px-2">
                {entries.length} Stories
              </h2>
              <div className="flex-1 h-px bg-[#1c1c1c]" />
            </div>
            <p className="text-xs text-[#525252] text-center -mt-2">
              Bookmark any story below to save it to a list
            </p>
            <div className="flex flex-col gap-2">
              {entries.map((entry, i) => (
                <DigestEntryCard key={i} entry={entry} index={i + 1} />
              ))}
            </div>
          </section>
        )}

        {/* Source link */}
        <SourceLink sourceUrl={article.sourceUrl as string | undefined} source={article.source as string | undefined} />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-[#1c1c1c]">
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled className="opacity-50 text-xs sm:text-sm">
              <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Discuss
            </Button>
            <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              {article.isFavorite ? "Unfavorite" : "Favorite"}
            </Button>
          </div>
          <Link href="/articles">
            <Button variant="ghost" size="sm" className="text-[#525252] hover:text-[#e5e5e5] text-xs sm:text-sm">
              ← Back
            </Button>
          </Link>
        </div>

        {/* Related */}
        <Link href="/articles">
          <div className="rounded-xl p-5 bg-[#111111] border border-[#1c1c1c] hover:border-[#2c2c2c] transition-colors cursor-pointer">
            <p className="text-[#525252] text-xs sm:text-sm text-center">
              ← More {article.category} articles
            </p>
          </div>
        </Link>
      </div>

      <style>{`
        .youtube-embed-wrapper {
          position: relative; width: 100%; padding-bottom: 56.25%;
          height: 0; overflow: hidden; border-radius: 0.75rem;
          margin: 1.5rem 0; border: 1px solid #1c1c1c;
          background: #09090b;
        }
        .youtube-embed-wrapper iframe {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          border-radius: 0.75rem;
        }
        html { scroll-padding-top: 1.5rem; }
        .prose table { display: block; overflow-x: auto; white-space: nowrap; }
        .prose a { transition: border-color 0.2s; }
      `}</style>
    </>
  );
}
