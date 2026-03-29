import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Clock, Star, Mic, Calendar, Tag, BookOpen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { preprocessYouTubeUrls } from "@/lib/rehype-youtube";
import { SourceLink, ArticleProgress } from "@/components/article";

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    "iframe",
    "div",
    "span",
  ],
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code || []), "className"],
    span: [...(defaultSchema.attributes?.span || []), "className"],
    pre: [...(defaultSchema.attributes?.pre || []), "className"],
    div: [...(defaultSchema.attributes?.div || []), "className"],
    iframe: [
      ...(defaultSchema.attributes?.iframe || []),
      "src",
      "frameborder",
      "allow",
      "allowfullscreen",
      "loading",
      "title",
    ],
  },
};

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

  if (!article || !article.isPublished) {
    notFound();
  }

  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });

  return (
    <>
      <ArticleProgress />

      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="flex items-center gap-3">
          <Link href="/articles">
            <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              All Articles
            </Button>
          </Link>
          <span className="text-zinc-800">|</span>
          <span className="text-zinc-600 text-sm">{article.category}</span>
        </div>

        {/* Cover Image */}
        {article.coverImage && (
          <div className="relative h-80 md:h-96 rounded-2xl overflow-hidden">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
          </div>
        )}

        {/* Article Header */}
        <div className="space-y-5">
          {/* Category Badge */}
          <span className="inline-block px-3 py-1 text-xs font-semibold bg-violet-500/20 text-violet-400 border border-violet-500/30 rounded-full">
            {article.category}
          </span>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-display leading-tight">
            {article.title}
          </h1>

          {/* Subtitle */}
          {article.subtitle && (
            <p className="text-lg md:text-xl text-zinc-400 leading-relaxed font-light">
              {article.subtitle}
            </p>
          )}

          {/* Meta Row */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 py-4 border-y border-zinc-800/60">
            {/* Author */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                {article.authorName.charAt(0)}
              </div>
              <div>
                <p className="text-white text-sm font-medium leading-none">{article.authorName}</p>
                <p className="text-zinc-600 text-xs mt-0.5">{timeAgo}</p>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden sm:block h-4 w-px bg-zinc-800" />

            {/* Reading Time */}
            <div className="flex items-center gap-1.5 text-zinc-500 text-sm">
              <BookOpen className="w-4 h-4" />
              <span>{article.readTime} min read</span>
            </div>

            {/* Favorite */}
            {article.isFavorite && (
              <>
                <div className="hidden sm:block h-4 w-px bg-zinc-800" />
                <div className="flex items-center gap-1.5 text-yellow-400 text-sm">
                  <Star className="w-4 h-4 fill-current" />
                  <span>Favorite</span>
                </div>
              </>
            )}
          </div>

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-zinc-600" />
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 text-xs font-medium bg-zinc-800/60 text-zinc-400 rounded-lg border border-zinc-700/30 hover:border-zinc-600/50 transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Article Content */}
        <article className="prose prose-invert prose-zinc prose-lg md:prose-xl max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[
              rehypeSanitize,
              [rehypeHighlight, { detect: true }],
            ]}
          >
            {preprocessYouTubeUrls(article.content)}
          </ReactMarkdown>
        </article>

        {/* Source Link */}
        <SourceLink
          sourceUrl={article.sourceUrl as string | undefined}
          source={article.source as string | undefined}
        />

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-zinc-800/60">
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              disabled
              title="Voice feature coming soon"
              className="opacity-60"
            >
              <Mic className="w-4 h-4 mr-2" />
              Discuss this article
            </Button>
            <Button variant="ghost" size="sm">
              <Star className="w-4 h-4 mr-2" />
              {article.isFavorite ? "Unfavorite" : "Favorite"}
            </Button>
          </div>
          <Link href="/articles">
            <Button variant="ghost" size="sm" className="text-zinc-600 hover:text-white">
              ← Back to Articles
            </Button>
          </Link>
        </div>

        {/* Related articles hint */}
        <div className="pt-4 pb-8">
          <Link href="/articles">
            <div className="glass rounded-2xl p-6 hover:glow-hover transition-all duration-300 cursor-pointer">
              <p className="text-zinc-500 text-sm text-center">
                ← Back to all {article.category} articles
              </p>
            </div>
          </Link>
        </div>
      </div>

      <style>{`
        /* YouTube embed responsive container */
        .youtube-embed-wrapper {
          position: relative;
          width: 100%;
          padding-bottom: 56.25%;
          height: 0;
          overflow: hidden;
          border-radius: 0.75rem;
          margin: 1.5rem 0;
          border: 1px solid rgba(255,255,255,0.06);
          background: #0a0a0a;
        }
        .youtube-embed-wrapper iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 0.75rem;
        }
        /* Smooth scroll offset for anchor links */
        html {
          scroll-padding-top: 2rem;
        }
        /* Code block improvements */
        pre code.hljs {
          padding: 0 !important;
        }
        /* Link underline on hover for article content */
        .prose a {
          transition: border-color 0.2s;
        }
        /* Blockquote subtle glow */
        .prose blockquote {
          box-shadow: inset 4px 0 0 rgba(139, 92, 246, 0.5);
        }
      `}</style>
    </>
  );
}
