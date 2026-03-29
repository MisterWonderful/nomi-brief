import { prisma, upsertDefaultUser } from "@/lib/prisma";
import { Link2, ExternalLink, Plus, Search, Filter, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getLinks() {
  try {
    const user = await upsertDefaultUser();
    return await prisma.linkEntry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  } catch {
    return [];
  }
}

export default async function LinksPage() {
  const links = await getLinks();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white font-display">Links</h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            {links.length > 0 ? `${links.length} saved links` : "Saved links from articles"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled
          title="Coming soon"
          className="text-xs flex-shrink-0 mt-1"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
          Add
        </Button>
      </div>

      {/* Search placeholder */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-500 text-sm">
          <Search className="w-4 h-4 flex-shrink-0" />
          <span className="text-xs sm:text-sm">Search links...</span>
        </div>
        <Button variant="ghost" size="sm" disabled className="text-xs">
          <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </Button>
      </div>

      {/* Links — single column on mobile, 2-3 on desktop */}
      {links.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:glow-hover transition-all duration-200 flex flex-col gap-2.5 group"
            >
              {/* Image */}
              {link.image && (
                <div className="relative h-28 sm:h-32 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={link.image}
                    alt={link.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              )}

              {/* Title + Favorite */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-xs sm:text-sm font-semibold text-white leading-snug line-clamp-2 flex-1 group-hover:text-violet-300 transition-colors">
                  {link.title}
                </h3>
                {link.isFavorite && (
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 flex-shrink-0 mt-0.5" />
                )}
              </div>

              {/* Description */}
              {link.description && (
                <p className="text-[10px] sm:text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                  {link.description}
                </p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-800/50">
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-zinc-600">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span>{formatDistanceToNow(new Date(link.createdAt), { addSuffix: true })}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {link.source && (
                    <span className="text-[10px] sm:text-xs text-zinc-700">{link.source}</span>
                  )}
                  <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-violet-400 transition-colors flex-shrink-0" />
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
            <Link2 className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-600" />
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-zinc-300 mb-2">No links yet</h2>
          <p className="text-zinc-500 max-w-xs text-xs sm:text-sm px-4">
            Links saved from articles will appear here. Use the{" "}
            <code className="text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] sm:text-xs">
              POST /api/links
            </code>{" "}
            endpoint to save external links.
          </p>
        </div>
      )}
    </div>
  );
}
