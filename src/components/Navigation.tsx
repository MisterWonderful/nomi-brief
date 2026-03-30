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
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed left-0 top-0 h-screen w-[220px] bg-black border-r border-zinc-800/80 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-zinc-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 1L8.5 5.5H13L9.5 8L11 12.5L7 10L3 12.5L4.5 8L1 5.5H5.5L7 1Z" fill="#a78bfa" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">Nomi Brief</span>
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 py-4 px-3">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-100
                    ${isActive
                      ? "bg-zinc-800/70 text-white font-medium"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/60"
                    }
                  `}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* User */}
      <div className="px-4 py-4 border-t border-zinc-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-zinc-400 text-xs font-medium">
            R
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-zinc-300 truncate">Ryan</p>
          </div>
        </div>
      </div>
    </nav>
  );
}
