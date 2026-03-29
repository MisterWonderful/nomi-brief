"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search, X } from "lucide-react";
import { useState } from "react";

interface SearchInputProps {
  placeholder?: string;
  className?: string;
}

export function SearchInput({ placeholder = "Search articles...", className = "" }: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [isPending, startTransition] = useTransition();

  const updateSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      // Reset to page 1 when searching
      params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearch(query);
  };

  const handleClear = () => {
    setQuery("");
    updateSearch("");
  };

  return (
    <form onSubmit={handleSubmit} className={`relative flex items-center ${className}`}>
      <Search
        className={`absolute left-3 w-4 h-4 text-zinc-500 pointer-events-none ${
          isPending ? "animate-pulse" : ""
        }`}
      />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onSubmit={handleSubmit}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 bg-zinc-900/80 border border-zinc-800 rounded-xl text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors"
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 p-1 rounded-md hover:bg-zinc-800 transition-colors"
        >
          <X className="w-3.5 h-3.5 text-zinc-500" />
        </button>
      )}
    </form>
  );
}
