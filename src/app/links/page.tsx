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
    return await prisma.linkEntry.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 });
  } catch { return []; }
}

export default async function LinksPage() {
  const links = await getLinks();
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#e5e5e5]">Links</h1>
          <p className="mt-1 text-xs sm:text-sm text-[#737373]">
            {links.length > 0 ? `${links.length} saved links` : "Saved links from articles"}
          </p>
        </div>
        <Button variant="ghost" size="sm" disabled title="Coming soon" className="text-xs flex-shrink-0 mt-1">
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" /> Add
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#111111] border border-[#1c1c1c] text-[#525252] text-sm">
          <Search className="w-4 h-4 flex-shrink-0" />
          <span className="text-xs sm:text-sm">Search links...</span>
        </div>
        <Button variant="ghost" size="sm" disabled className="text-xs">
          <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </Button>
      </div>

      {links.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {links.map((link) => (
            <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
              className="bg-[#111111] border border-[#1c1c1c] rounded-xl p-4 hover:border-[#2c2c2c] transition-colors flex flex-col gap-2.5 group">
              {link.image && (
                <div className="relative h-28 sm:h-32 rounded-lg overflow-hidden flex-shrink-0">
                  <Image src={link.image} alt={link.title} fill className="object-cover" />
                </div>
              )}
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-xs sm:text-sm font-semibold text-[#e5e5e5] leading-snug line-clamp-2 flex-1 group-hover:text-[#4ade80] transition-colors">
                  {link.title}
                </h3>
                {link.isFavorite && <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 flex-shrink-0 mt-0.5" />}
              </div>
              {link.description && (
                <p className="text-[10px] sm:text-xs text-[#525252] line-clamp-2 leading-relaxed">{link.description}</p>
              )}
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#1c1c1c]">
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-[#525252]">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span>{formatDistanceToNow(new Date(link.createdAt), { addSuffix: true })}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {link.source && <span className="text-[10px] sm:text-xs text-[#525252]">{link.source}</span>}
                  <ExternalLink className="w-3 h-3 text-[#525252] flex-shrink-0" />
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-[#111111] border border-[#1c1c1c] flex items-center justify-center mb-4">
            <Link2 className="w-6 h-6 sm:w-8 sm:h-8 text-[#525252]" />
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-[#737373] mb-2">No links yet</h2>
          <p className="text-[#525252] max-w-xs text-xs sm:text-sm px-4">
            Links saved from articles will appear here. Use the{" "}
            <code className="text-[#737373] bg-[#111111] px-1.5 py-0.5 rounded text-[10px] sm:text-xs">POST /api/links</code>{" "}
            endpoint to save external links.
          </p>
        </div>
      )}
    </div>
  );
}
