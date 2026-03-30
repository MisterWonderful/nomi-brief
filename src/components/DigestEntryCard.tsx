"use client";

import { useState } from "react";
import Image from "next/image";
import { ExternalLink, Bookmark, Clock } from "lucide-react";
import { SaveToListModal } from "./lists/SaveToListModal";
import { formatDistanceToNow } from "date-fns";

export interface DigestEntry {
  title: string;
  description?: string;
  url?: string;
  source?: string;
  date?: string;
  tags?: string[];
  image?: string | null;
}

interface DigestEntryCardProps {
  entry: DigestEntry;
  index: number;
}

export function DigestEntryCard({ entry, index }: DigestEntryCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [imgError, setImgError] = useState(false);
  const date = entry.date ? formatDistanceToNow(new Date(entry.date), { addSuffix: true }) : null;

  return (
    <>
      <article className="group flex gap-3 p-3 rounded-xl glass hover:glow-hover transition-all duration-200">
        {/* Index badge */}
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center mt-0.5">
          <span className="text-[10px] font-bold text-violet-400">{index}</span>
        </div>

        {/* Left: Optional image */}
        {entry.image && !imgError && (
          <div className="relative w-[72px] h-[72px] flex-shrink-0 rounded-lg overflow-hidden bg-zinc-900">
            <Image
              src={entry.image}
              alt={entry.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.06]"
              sizes="72px"
              onError={() => setImgError(true)}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-[13px] sm:text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-violet-300 transition-colors">
                {entry.url ? (
                  <a href={entry.url} target="_blank" rel="noopener noreferrer" className="hover:underline decoration-violet-500/50">
                    {entry.title}
                  </a>
                ) : (
                  entry.title
                )}
              </h3>
            </div>
          </div>

          {entry.description && (
            <p className="text-[11px] sm:text-xs text-zinc-500 line-clamp-2 leading-relaxed">
              {entry.description}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-2 text-[10px] text-zinc-600">
              {entry.source && <span>{entry.source}</span>}
              {date && <><span>·</span><span>{date}</span></>}
            </div>

            <div className="flex items-center gap-1">
              {entry.url && (
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
                  title="Open source"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                onClick={() => setShowModal(true)}
                className="p-1.5 rounded-lg text-zinc-600 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                title="Save to list"
              >
                <Bookmark className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </article>

      <SaveToListModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        item={{
          title: entry.title,
          description: entry.description,
          url: entry.url,
          image: entry.image || undefined,
          tags: entry.tags,
        }}
      />
    </>
  );
}
