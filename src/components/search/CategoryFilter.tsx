"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Tag } from "lucide-react";

const CATEGORIES = ["All", "AI & Technology", "Infrastructure", "Development", "Research", "General"];

interface CategoryFilterProps { className?: string; }

export function CategoryFilter({ className = "" }: CategoryFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const currentCategory = searchParams.get("category") || "All";

  const updateCategory = useCallback(
    (category: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (category !== "All") { params.set("category", category); } else { params.delete("category"); }
      params.delete("page");
      startTransition(() => { router.push(`${pathname}?${params.toString()}`); });
    },
    [pathname, router, searchParams]
  );

  return (
    <div className={`flex items-center gap-1 flex-wrap ${isPending ? "opacity-60" : ""} ${className}`}>
      <Tag className="w-4 h-4 text-[#525252] mr-2" />
      {CATEGORIES.map((cat) => (
        <button key={cat} onClick={() => updateCategory(cat)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            currentCategory === cat || (cat === "All" && !searchParams.get("category"))
              ? "bg-[#111111] text-[#4ade80] border border-[#1c1c1c] hover:border-[#2c2c2c]"
              : "text-[#525252] hover:text-[#e5e5e5] hover:bg-[#141414]"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
