"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Pencil,
  Check,
  X,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Youtube,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ListItem {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  image: string | null;
  notes: string | null;
  tags: string[];
  youtubeUrl: string | null;
  richContent: string | null;
  sourceUrl: string | null;
  createdAt: string;
}

interface ListData {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  items: ListItem[];
}

export function ListDetailClient({ list }: { list: ListData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(list.name);
  const [description, setDescription] = useState(list.description || "");
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [deletingItem, setDeletingItem] = useState<string | null>(null);

  async function handleSave() {
    await fetch(`/api/lists/${list.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
    });
    setEditing(false);
    router.refresh();
  }

  async function handleDeleteItem(itemId: string) {
    setDeletingItem(itemId);
    try {
      const res = await fetch(`/api/items/${itemId}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeletingItem(null);
    }
  }

  async function handleDeleteList() {
    if (!confirm(`Delete "${list.name}" and all its items?`)) return;
    const res = await fetch(`/api/lists/${list.id}`, { method: "DELETE" });
    if (res.ok) router.push("/lists");
  }

  function toggleNotes(id: string) {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      {/* Header */}
      <div className="space-y-3">
        {editing ? (
          <div className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-2xl font-bold bg-transparent border-b border-[#4ade80] text-white focus:outline-none "
              autoFocus
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full text-sm bg-transparent border-b border-zinc-700 text-zinc-400 focus:outline-none placeholder:text-zinc-600"
            />
            <div className="flex gap-2">
              <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111111] text-[#4ade80] text-sm hover:border-[#2c2c2c]">
                <Check className="w-4 h-4" /> Save
              </button>
              <button onClick={() => { setEditing(false); setName(list.name); setDescription(list.description || ""); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-sm hover:bg-zinc-700">
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white ">{list.name}</h1>
              {list.description && (
                <p className="text-sm text-zinc-500 mt-1">{list.description}</p>
              )}
              <p className="text-xs text-zinc-600 mt-2">
                {list.items.length} {list.items.length === 1 ? "item" : "items"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(true)}
                className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={handleDeleteList}
                className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Items */}
      {list.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-xl bg-zinc-800/50 flex items-center justify-center mb-3">
            <FolderOpen className="w-7 h-7 text-zinc-600" />
          </div>
          <h3 className="text-base font-medium text-zinc-400 mb-1">No items yet</h3>
          <p className="text-sm text-zinc-600 max-w-xs">
            Save articles, links, or notes to this list from anywhere in the app.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 p-4 rounded-xl bg-[#111111] border border-[#1c1c1c] hover:border-[#2c2c2c] transition-all"
            >
              {/* Image */}
              {item.image && (
                <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-900">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1.5">
                {/* Title */}
                <div className="flex items-start justify-between gap-2">
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-white hover:text-[#4ade80] transition-colors line-clamp-2"
                    >
                      {item.title}
                    </a>
                  ) : (
                    <h3 className="text-sm font-semibold text-white line-clamp-2">{item.title}</h3>
                  )}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded text-zinc-600 hover:text-zinc-300 transition-colors"
                        title="Open URL"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      disabled={deletingItem === item.id}
                      className="p-1 rounded text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-50"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {item.description && (
                  <p className="text-xs text-zinc-500 line-clamp-2">{item.description}</p>
                )}

                {/* YouTube embed */}
                {item.youtubeUrl && (
                  <div className="mt-2">
                    <a
                      href={item.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition-all"
                    >
                      <Youtube className="w-3.5 h-3.5" />
                      Watch on YouTube
                    </a>
                  </div>
                )}

                {/* Tags */}
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-[10px] font-medium bg-zinc-800/60 text-zinc-400 rounded-md border border-zinc-700/30"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Notes (collapsible) */}
                {item.notes && (
                  <div className="mt-1">
                    <button
                      onClick={() => toggleNotes(item.id)}
                      className="flex items-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
                    >
                      {expandedNotes.has(item.id) ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                      Notes
                    </button>
                    {expandedNotes.has(item.id) && (
                      <p className="text-xs text-zinc-400 mt-1 whitespace-pre-wrap bg-zinc-800/30 rounded-lg p-2">
                        {item.notes}
                      </p>
                    )}
                  </div>
                )}

                {/* Source */}
                {item.sourceUrl && (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors truncate block"
                  >
                    Source: {item.sourceUrl}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
