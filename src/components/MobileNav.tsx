"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Newspaper, Link2, Settings, Home, Bookmark, List } from "lucide-react";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/articles", icon: Newspaper, label: "Articles" },
  { href: "/saved", icon: Bookmark, label: "Saved" },
  { href: "/lists", icon: List, label: "Lists" },
  { href: "/links", icon: Link2, label: "Links" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-zinc-800/80 md:hidden">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] transition-colors
                ${isActive ? "text-white" : "text-zinc-600"}
              `}
            >
              <Icon className="w-4 h-4" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
