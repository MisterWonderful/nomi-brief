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
    const links = await prisma.linkEntry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return links;
  } catch (error) {
    console.error("Error fetching links:", error);
    return [];
  }
}

export default async function LinksPage() {
  const links = await getLinks();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white font-display">Links</h1>
          <p className="text-zinc-400 mt-1">
            {links.length > 0 ? `${links.length} saved links` : "Saved links from articles and bookmarks"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled
          title="Coming soon — use the /api/links endpoint to save links"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Link
        </Button>
      </div>

      {/* Filters — visual only, wired for future */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-1">
          <Button variant="primary" size="sm">
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
          <Button variant="ghost" size="sm" disabled title="Coming soon">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Links Grid */}
      {links.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass rounded-2xl p-5 hover:glow-hover transition-all duration-300 flex flex-col gap-3 group"
            >
              {/* Image + Title row */}
              {link.image && (
                <div className="relative h-32 w-full rounded-xl overflow-hidden flex-shrink-0">
                  <Image
                    src={link.image}
                    alt={link.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-white font-semibold text-sm line-clamp-2 flex-1">
                  {link.title}
                </h3>
                {link.isFavorite && <Star className="w-4 h-4 text-yellow-400 fill-current flex-shrink-0" />}
              </div>
              {link.description && (
                <p className="text-zinc-500 text-xs line-clamp-2">{link.description}</p>
              )}
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-800/50">
                <span className="text-zinc-600 text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(link.createdAt), { addSuffix: true })}
                </span>
                {link.source && (
                  <span className="text-zinc-700 text-xs">{link.source}</span>
                )}
                <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-violet-400 transition-colors" />
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
            <Link2 className="w-8 h-8 text-zinc-600" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-300 mb-2">No links yet</h2>
          <p className="text-zinc-500 max-w-md text-sm">
            Links saved from articles will appear here. Use the{" "}
            <code className="text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded text-xs">
              POST /api/links
            </code>{" "}
            endpoint to save external links programmatically.
          </p>
        </div>
      )}
    </div>
  );
}
