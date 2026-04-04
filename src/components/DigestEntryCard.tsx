"use client";

import { useState } from "react";
import Image from "next/image";
import { ExternalLink, Bookmark } from "lucide-react";
import { SaveToListModal } from "./lists/SaveToListModal";
import { formatDistanceToNow } from "date-fns";

export interface DigestEntry {
  title: string; description?: string; url?: string; source?: string;
  date?: string; tags?: string[]; image?: string | null;
}

interface DigestEntryCardProps { entry: DigestEntry; index: number; }

export function DigestEntryCard({ entry, index }: DigestEntryCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [imgError, setImgError] = useState(false);
  const date = entry.date ? formatDistanceToNow(new Date(entry.date), { addSuffix: true }) : null;

  return (
    <>
      <article className="group flex gap-3 p-3 rounded-lg border border-transparent hover:border-[#1c1c1c] hover:bg-[#111111] transition-all duration-150">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#111111] border border-[#1c1c1c] flex items-center justify-center mt-0.5">
          <span className="text-[10px] font-medium text-[#525252]">{index}</span>
        </div>
        {entry.image && !imgError && (
          <div className="relative w-[64px] h-[64px] flex-shrink-0 rounded-md overflow-hidden bg-[#111111]">
            <Image src={entry.image} alt="" fill className="object-cover" sizes="64px" onError={() => setImgError(true)} />
          </div>
        )}
        <div className="flex-1 min-w-0 flex flex-col justify-between gap-1">
          <div>
            <h3 className="text-[13px] font-medium text-[#e5e5e5] leading-snug line-clamp-2 group-hover:text-[#4ade80] transition-colors">
              {entry.url ? <a href={entry.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{entry.title}</a> : entry.title}
            </h3>
            {entry.description && (
              <p className="text-[11px] text-[#525252] line-clamp-1.5 leading-relaxed mt-0.5">{entry.description}</p>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-1.5 text-[11px] text-[#525252]">
              {entry.source && <span>{entry.source}</span>}
              {date && <><span>·</span><span>{date}</span></>}
            </div>
            <div className="flex items-center gap-0.5">
              {entry.url && (
                <a href={entry.url} target="_blank" rel="noopener noreferrer"
                  className="p-1 rounded text-[#525252] hover:text-[#e5e5e5] transition-colors" title="Open source"
                  onClick={(e) => e.stopPropagation()}>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button onClick={() => setShowModal(true)}
                className="p-1 rounded text-[#525252] hover:text-[#4ade80] transition-colors" title="Save to list">
                <Bookmark className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </article>
      <SaveToListModal isOpen={showModal} onClose={() => setShowModal(false)}
        item={{ title: entry.title, description: entry.description, url: entry.url, image: entry.image || undefined, tags: entry.tags }} />
    </>
  );
}
