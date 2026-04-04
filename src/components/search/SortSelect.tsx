"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { ArrowUpDown } from "lucide-react";

type SortOption = "newest" | "oldest" | "readTime" | "favorites";
const SORT_LABELS: Record<SortOption, string> = { newest: "Newest", oldest: "Oldest", readTime: "Read Time", favorites: "Favorites" };
const SORT_OPTIONS: SortOption[] = ["newest", "oldest", "readTime", "favorites"];

interface SortSelectProps { className?: string; }

export function SortSelect({ className = "" }: SortSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const currentSort = (searchParams.get("sort") as SortOption) || "newest";

  const updateSort = useCallback(
    (sort: SortOption) => {
      const params = new URLSearchParams(searchParams.toString());
      if (sort !== "newest") { params.set("sort", sort); } else { params.delete("sort"); }
      params.delete("page");
      startTransition(() => { router.push(`${pathname}?${params.toString()}`); });
    },
    [pathname, router, searchParams]
  );

  return (
    <div className={`flex items-center gap-1 ${isPending ? "opacity-60" : ""}`}>
      <ArrowUpDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#525252] flex-shrink-0" />
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
        {SORT_OPTIONS.map((opt) => (
          <button key={opt} onClick={() => updateSort(opt)}
            className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-colors whitespace-nowrap ${
              currentSort === opt
                ? "bg-[#111111] text-[#4ade80] border border-[#1c1c1c]"
                : "text-[#525252] hover:text-[#e5e5e5] hover:bg-[#141414]"
            }`}
          >
            {SORT_LABELS[opt]}
          </button>
        ))}
      </div>
    </div>
  );
}
