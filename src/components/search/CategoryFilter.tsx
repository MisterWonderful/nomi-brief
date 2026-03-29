"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Tag } from "lucide-react";

const CATEGORIES = ["All", "AI & Technology", "Infrastructure", "Development", "Research", "General"];

interface CategoryFilterProps {
  className?: string;
}

export function CategoryFilter({ className = "" }: CategoryFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentCategory = searchParams.get("category") || "All";

  const updateCategory = useCallback(
    (category: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (category !== "All") {
        params.set("category", category);
      } else {
        params.delete("category");
      }
      params.delete("page"); // Reset to page 1
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  return (
    <div className={`flex items-center gap-1 flex-wrap ${isPending ? "opacity-60" : ""} ${className}`}>
      <Tag className="w-4 h-4 text-zinc-500 mr-2" />
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => updateCategory(cat)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            currentCategory === cat || (cat === "All" && !searchParams.get("category"))
              ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
              : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
