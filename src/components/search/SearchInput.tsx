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
      if (value) { params.set("q", value); } else { params.delete("q"); }
      params.delete("page");
      startTransition(() => { router.push(`${pathname}?${params.toString()}`); });
    },
    [pathname, router, searchParams]
  );

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); updateSearch(query); };
  const handleClear = () => { setQuery(""); updateSearch(""); };

  return (
    <form onSubmit={handleSubmit} className={`relative flex items-center ${className}`}>
      <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#525252] pointer-events-none ${isPending ? "animate-pulse" : ""}`} />
      <input
        type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder}
        className="w-full pl-10 pr-10 py-3 sm:py-2.5 bg-[#111111] border border-[#1c1c1c] rounded-xl text-[#e5e5e5] text-sm placeholder:text-[#525252] focus:outline-none focus:border-[#4ade80]/50 focus:ring-1 focus:ring-[#4ade80]/20 transition-colors min-h-[44px]"
      />
      {query && (
        <button type="button" onClick={handleClear} className="absolute right-3 p-1 rounded-md hover:bg-[#141414] transition-colors">
          <X className="w-3.5 h-3.5 text-[#525252]" />
        </button>
      )}
    </form>
  );
}
