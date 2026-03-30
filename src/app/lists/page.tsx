import { prisma, upsertDefaultUser } from "@/lib/prisma";
import Link from "next/link";
import * as LucideIcons from "lucide-react";
import { Plus, FolderOpen } from "lucide-react";
import { ListsClient } from "./ListsClient";

export const dynamic = "force-dynamic";

// Dynamic icon resolver
function ListIcon({ iconName, className }: { iconName: string; className?: string }) {
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  const pascalName = iconName.charAt(0).toUpperCase() + iconName.slice(1).replace(/-./g, (x) => x[1].toUpperCase());
  const Icon = icons[pascalName] || LucideIcons.Bookmark;
  return <Icon className={className} />;
}

const COLOR_MAP: Record<string, string> = {
  violet: "from-violet-500/20 to-purple-500/10 border-violet-500/30",
  blue: "from-blue-500/20 to-cyan-500/10 border-blue-500/30",
  green: "from-green-500/20 to-emerald-500/10 border-green-500/30",
  amber: "from-amber-500/20 to-yellow-500/10 border-amber-500/30",
  red: "from-red-500/20 to-rose-500/10 border-red-500/30",
  pink: "from-pink-500/20 to-rose-500/10 border-pink-500/30",
  cyan: "from-cyan-500/20 to-teal-500/10 border-cyan-500/30",
  white: "from-zinc-400/20 to-zinc-500/10 border-zinc-400/30",
};

const ICON_COLOR_MAP: Record<string, string> = {
  violet: "text-violet-400",
  blue: "text-blue-400",
  green: "text-green-400",
  amber: "text-amber-400",
  red: "text-red-400",
  pink: "text-pink-400",
  cyan: "text-cyan-400",
  white: "text-zinc-300",
};

export default async function ListsPage() {
  const user = await upsertDefaultUser();
  const lists = await prisma.list.findMany({
    where: { userId: user.id },
    include: { _count: { select: { items: true } } },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Lists</h1>
          <p className="text-sm text-zinc-500 mt-1">Your curated collections</p>
        </div>
        <ListsClient />
      </div>

      {/* Lists Grid */}
      {lists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-zinc-600" />
          </div>
          <h3 className="text-lg font-medium text-zinc-400 mb-2">No lists yet</h3>
          <p className="text-sm text-zinc-600 max-w-sm">
            Create your first list to start organizing items. Lists can hold articles, links, projects, and more.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map((list) => (
            <Link
              key={list.id}
              href={`/lists/${list.id}`}
              className="group block"
            >
              <div
                className={`relative p-5 rounded-xl bg-gradient-to-br border transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${COLOR_MAP[list.color] || COLOR_MAP.violet}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-zinc-900/60 flex items-center justify-center ${ICON_COLOR_MAP[list.color] || "text-violet-400"}`}>
                    <ListIcon iconName={list.icon} className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-zinc-500">
                    {list._count.items} {list._count.items === 1 ? "item" : "items"}
                  </span>
                </div>
                <h3 className="font-semibold text-white group-hover:text-violet-300 transition-colors">
                  {list.name}
                </h3>
                {list.description && (
                  <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{list.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
