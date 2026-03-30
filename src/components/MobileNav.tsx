"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Newspaper, Link2, Settings, Home, Menu, X, Bookmark, List } from "lucide-react";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/articles", icon: Newspaper, label: "Articles" },
  { href: "/saved", icon: Bookmark, label: "Saved" },
  { href: "/lists", icon: List, label: "Lists" },
  { href: "/links", icon: Link2, label: "Links" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-zinc-800/80 md:hidden">
      {/* Mobile toggle */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/60">
        <span className="text-xs font-medium text-zinc-500">Navigation</span>
        <button
          onClick={() => setOpen(!open)}
          className="p-1 rounded text-zinc-500 hover:text-zinc-300"
        >
          {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded menu */}
      {open && (
        <div className="bg-black border-t border-zinc-800/60">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`
                  flex items-center gap-3 px-5 py-3 text-sm border-b border-zinc-900/80 transition-colors
                  ${isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300"}
                `}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.slice(0, 5).map((item) => {
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
