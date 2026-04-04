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
    <nav className="fixed left-0 top-0 h-screen w-[220px] bg-[#09090b] border-r border-[#1c1c1c] flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#1c1c1c]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#1c1c1c] flex items-center justify-center">
            <span className="text-[11px] font-bold text-[#e5e5e5] tracking-tight">NB</span>
          </div>
          <span className="text-[13px] font-semibold text-[#e5e5e5] tracking-tight">Nomi Brief</span>
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
                    flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150
                    ${isActive
                      ? "bg-[#111111] text-[#4ade80] font-medium border-l border-[#4ade80]"
                      : "text-[#525252] hover:text-[#e5e5e5] hover:bg-[#0f0f0f]"
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
      <div className="px-4 py-4 border-t border-[#1c1c1c]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#1c1c1c] flex items-center justify-center text-[#737373] text-xs font-medium">
            R
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#e5e5e5] truncate">Ryan</p>
          </div>
        </div>
      </div>
    </nav>
  );
}
