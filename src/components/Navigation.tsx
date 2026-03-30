"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Newspaper, 
  Link2, 
  Settings, 
  Mic2, 
  Sparkles,
  Home,
  Bookmark 
} from "lucide-react";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/articles", icon: Newspaper, label: "Articles" },
  { href: "/saved", icon: Bookmark, label: "Saved" },
  { href: "/links", icon: Link2, label: "Links" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed left-0 top-0 h-screen w-64 bg-zinc-950/80 backdrop-blur-xl border-r border-zinc-800/50 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-zinc-800/50">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-white">Nomi Brief</h1>
            <p className="text-xs text-zinc-500">AI News Platform</p>
          </div>
        </Link>
      </div>

      {/* Nav Items */}
      <div className="flex-1 py-6 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive 
                      ? "bg-violet-500/10 text-violet-400" 
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                    }
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute left-0 w-1 h-8 bg-violet-500 rounded-r-full"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Voice Indicator */}
      <div className="p-4 border-t border-zinc-800/50">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-800/50 text-zinc-400">
          <div className="relative">
            <Mic2 className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Voice</p>
            <p className="text-xs text-zinc-500">Coming soon</p>
          </div>
        </div>
      </div>

      {/* User */}
      <div className="p-4 border-t border-zinc-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-medium">
            R
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Ryan</p>
            <p className="text-xs text-zinc-500 truncate">@MisterWonderful</p>
          </div>
        </div>
      </div>
    </nav>
  );
}
