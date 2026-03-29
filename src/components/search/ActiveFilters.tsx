"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { X, SlidersHorizontal } from "lucide-react";

export function ActiveFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const hasFilters = searchParams.has("q") || searchParams.has("category") || searchParams.has("sort") || searchParams.has("unreadOnly");

  if (!hasFilters) return null;

  const clearAll = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  const removeFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const activeFilters = [
    searchParams.get("q") && { key: "q", label: `"${searchParams.get("q")}"` },
    searchParams.get("category") && { key: "category", label: searchParams.get("category") },
    searchParams.get("sort") && { key: "sort", label: `Sort: ${searchParams.get("sort")}` },
    searchParams.has("unreadOnly") && { key: "unreadOnly", label: "Unread only" },
  ].filter(Boolean) as { key: string; label: string }[];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1 text-zinc-500 text-xs">
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span>Filters:</span>
      </div>
      {activeFilters.map((f) => (
        <button
          key={f.key}
          onClick={() => removeFilter(f.key)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-400 text-xs border border-violet-500/20 hover:border-violet-500/40 transition-colors group"
        >
          {f.label}
          <X className="w-3 h-3 opacity-60 group-hover:opacity-100" />
        </button>
      ))}
      <button
        onClick={clearAll}
        className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors underline underline-offset-2"
      >
        Clear all
      </button>
      {isPending && (
        <span className="text-zinc-600 text-xs animate-pulse">Applying...</span>
      )}
    </div>
  );
}
