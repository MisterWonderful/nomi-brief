"use client";

import { useState, useEffect } from "react";
import { X, Plus, Check, Bookmark } from "lucide-react";

interface ListOption {
  id: string;
  name: string;
  icon: string;
  color: string;
  _count: { items: number };
}

interface SaveToListModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    title: string;
    description?: string;
    url?: string;
    image?: string;
    sourceUrl?: string;
    sourceArticleId?: string;
    tags?: string[];
  };
}

const COLOR_MAP: Record<string, string> = {
  violet: "text-violet-400",
  blue: "text-blue-400",
  green: "text-green-400",
  amber: "text-amber-400",
  red: "text-red-400",
  pink: "text-pink-400",
  cyan: "text-cyan-400",
  white: "text-zinc-300",
};

export function SaveToListModal({ isOpen, onClose, item }: SaveToListModalProps) {
  const [lists, setLists] = useState<ListOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newListName, setNewListName] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchLists();
      setSaved(null);
    }
  }, [isOpen]);

  async function fetchLists() {
    setLoading(true);
    try {
      const res = await fetch("/api/lists");
      if (res.ok) {
        const data = await res.json();
        setLists(data);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveToList(listId: string) {
    setSaving(listId);
    try {
      const res = await fetch(`/api/lists/${listId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          description: item.description,
          url: item.url,
          image: item.image,
          sourceUrl: item.sourceUrl,
          sourceArticleId: item.sourceArticleId,
          tags: item.tags || [],
        }),
      });
      if (res.ok) {
        setSaved(listId);
        setTimeout(() => onClose(), 800);
      }
    } finally {
      setSaving(null);
    }
  }

  async function handleCreateAndSave() {
    if (!newListName.trim()) return;
    setSaving("new");
    try {
      const createRes = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newListName.trim() }),
      });
      if (createRes.ok) {
        const newList = await createRes.json();
        await handleSaveToList(newList.id);
        setShowCreate(false);
        setNewListName("");
      }
    } finally {
      setSaving(null);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-2xl p-5 max-h-[80vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Save to List</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item preview */}
        <div className="mb-4 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
          <p className="text-sm text-white font-medium line-clamp-1">{item.title}</p>
          {item.description && (
            <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{item.description}</p>
          )}
        </div>

        {/* Lists */}
        <div className="space-y-1.5">
          {loading ? (
            <div className="py-8 text-center text-zinc-600 text-sm">Loading lists...</div>
          ) : lists.length === 0 ? (
            <div className="py-4 text-center text-zinc-600 text-sm">No lists yet</div>
          ) : (
            lists.map((list) => (
              <button
                key={list.id}
                onClick={() => handleSaveToList(list.id)}
                disabled={saving === list.id}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-zinc-800/60 transition-all disabled:opacity-50 text-left"
              >
                <div className={`w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center ${COLOR_MAP[list.color] || "text-violet-400"}`}>
                  <Bookmark className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">{list.name}</p>
                  <p className="text-[10px] text-zinc-600">
                    {list._count.items} {list._count.items === 1 ? "item" : "items"}
                  </p>
                </div>
                {saved === list.id ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : saving === list.id ? (
                  <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                ) : null}
              </button>
            ))
          )}
        </div>

        {/* Create new list */}
        {showCreate ? (
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="List name"
              className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreateAndSave()}
            />
            <button
              onClick={handleCreateAndSave}
              disabled={saving === "new" || !newListName.trim()}
              className="px-3 py-2 rounded-lg bg-violet-500 text-white text-sm disabled:opacity-50"
            >
              {saving === "new" ? "..." : "Create & Save"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-zinc-700 text-zinc-500 hover:text-violet-400 hover:border-violet-500/50 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            Create new list
          </button>
        )}
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.2s ease-out;
        }
        @media (min-width: 640px) {
          .animate-slide-up {
            animation: fade-in 0.15s ease-out;
          }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
