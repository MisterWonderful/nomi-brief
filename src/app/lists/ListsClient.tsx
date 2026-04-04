"use client";

import { useState } from "react";
import * as LucideIcons from "lucide-react";
import { Plus, X, Loader2 } from "lucide-react";

const COLORS = ["violet", "blue", "green", "amber", "red", "pink", "cyan"];
const ICON_OPTIONS = ["Bookmark", "Star", "Heart", "Folder", "Tag", "Hash", "Globe", "Code", "Zap", "Sparkles"];

function ListIcon({ iconName, className }: { iconName: string; className?: string }) {
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  const pascalName = iconName.charAt(0).toUpperCase() + iconName.slice(1).replace(/-./g, (x) => x[1].toUpperCase());
  const Icon = icons[pascalName] || LucideIcons.Bookmark;
  return <Icon className={className} />;
}

export function ListsClient() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("violet");
  const [icon, setIcon] = useState("Bookmark");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description, color, icon }),
      });
      if (res.ok) {
        setName(""); setDescription(""); setColor("violet"); setIcon("Bookmark");
        setIsOpen(false);
        window.location.reload();
      }
    } finally { setLoading(false); }
  };

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111111] text-[#4ade80] border border-[#1c1c1c] hover:border-[#2c2c2c] transition-colors text-sm font-medium">
        <Plus className="w-4 h-4" /> New list
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#111111] border border-[#1c1c1c] rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-[#e5e5e5]">Create new list</h2>
          <button onClick={() => setIsOpen(false)} className="text-[#525252] hover:text-[#e5e5e5]"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="List name"
            className="w-full px-3 py-2 rounded-lg bg-[#09090b] border border-[#1c1c1c] text-[#e5e5e5] placeholder:text-[#525252] focus:outline-none focus:border-[#4ade80] text-sm" />
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)"
            className="w-full px-3 py-2 rounded-lg bg-[#09090b] border border-[#1c1c1c] text-[#e5e5e5] placeholder:text-[#525252] focus:outline-none focus:border-[#4ade80] text-sm" />
          <div>
            <p className="text-xs text-[#525252] mb-1">Icon</p>
            <div className="flex flex-wrap gap-1.5">
              {ICON_OPTIONS.map((ic) => (
                <button key={ic} onClick={() => setIcon(ic)}
                  className={`p-2 rounded-lg border transition-colors ${icon === ic ? "border-[#4ade80] bg-[#09090b] text-[#4ade80]" : "border-[#1c1c1c] text-[#525252] hover:border-[#2c2c2c]"}`}>
                  <ListIcon iconName={ic} className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleCreate} disabled={loading || !name.trim()}
            className="w-full py-2.5 rounded-xl bg-[#111111] text-[#4ade80] border border-[#1c1c1c] hover:border-[#2c2c2c] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">
            {loading ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : "Create list"}
          </button>
        </div>
      </div>
    </div>
  );
}
