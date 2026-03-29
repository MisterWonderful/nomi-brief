"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { TrendingUp, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";

type HomeSort = "trending" | "recent" | "favorites";

const FILTERS: { key: HomeSort; label: string; icon: typeof TrendingUp }[] = [
  { key: "trending", label: "Trending", icon: TrendingUp },
  { key: "recent", label: "Recent", icon: Clock },
  { key: "favorites", label: "Favorites", icon: Star },
];

export function HomeSortNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSort = (searchParams.get("sort") as HomeSort) || "trending";

  const updateSort = useCallback(
    (sort: HomeSort) => {
      const params = new URLSearchParams(searchParams.toString());
      if (sort !== "trending") {
        params.set("sort", sort);
      } else {
        params.delete("sort");
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  return (
    <div className="flex items-center gap-2 px-1">
      {FILTERS.map(({ key, label, icon: Icon }) => (
        <Button
          key={key}
          variant={currentSort === key ? "primary" : "ghost"}
          size="sm"
          onClick={() => updateSort(key)}
          disabled={isPending}
          className={isPending && currentSort === key ? "opacity-70" : ""}
        >
          <Icon className="w-4 h-4 mr-2" />
          {label}
        </Button>
      ))}
    </div>
  );
}
