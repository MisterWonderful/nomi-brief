import { prisma, upsertDefaultUser } from "@/lib/prisma";
import Link from "next/link";
import * as LucideIcons from "lucide-react";
import { FolderOpen } from "lucide-react";
import { ListsClient } from "./ListsClient";

export const dynamic = "force-dynamic";

function ListIcon({ iconName, className }: { iconName: string; className?: string }) {
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  const pascalName = iconName.charAt(0).toUpperCase() + iconName.slice(1).replace(/-./g, (x) => x[1].toUpperCase());
  const Icon = icons[pascalName] || LucideIcons.Bookmark;
  return <Icon className={className} />;
}

const COLOR_MAP: Record<string, string> = {
  violet: "bg-[#111111] border-[#1c1c1c]",
  blue: "bg-[#111111] border-[#1c1c1c]",
  green: "bg-[#111111] border-[#1c1c1c]",
  amber: "bg-[#111111] border-[#1c1c1c]",
  red: "bg-[#111111] border-[#1c1c1c]",
  pink: "bg-[#111111] border-[#1c1c1c]",
  cyan: "bg-[#111111] border-[#1c1c1c]",
  white: "bg-[#111111] border-[#1c1c1c]",
};

const ICON_COLOR_MAP: Record<string, string> = {
  violet: "text-[#525252]",
  blue: "text-[#525252]",
  green: "text-[#525252]",
  amber: "text-[#525252]",
  red: "text-[#525252]",
  pink: "text-[#525252]",
  cyan: "text-[#525252]",
  white: "text-[#525252]",
};

export default async function ListsPage() {
  const user = await upsertDefaultUser();
  const lists = await prisma.list.findMany({
    where: { userId: user.id },
    include: { _count: { select: { items: true } } },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#e5e5e5]">Lists</h1>
          <p className="text-sm text-[#525252] mt-1">Your curated collections</p>
        </div>
        <ListsClient />
      </div>

      {lists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-xl bg-[#111111] border border-[#1c1c1c] flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-[#525252]" />
          </div>
          <h3 className="text-lg font-medium text-[#737373] mb-2">No lists yet</h3>
          <p className="text-sm text-[#525252] max-w-sm">
            Create your first list to start organizing items.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {lists.map((list) => (
            <Link key={list.id} href={`/lists/${list.id}`} className="group block">
              <div className={`relative p-5 rounded-xl border transition-colors duration-200 hover:border-[#2c2c2c] ${COLOR_MAP[list.color] || COLOR_MAP.violet}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-[#09090b] flex items-center justify-center ${ICON_COLOR_MAP[list.color] || "text-[#525252]"}`}>
                    <ListIcon iconName={list.icon} className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-[#525252]">
                    {list._count.items} {list._count.items === 1 ? "item" : "items"}
                  </span>
                </div>
                <h3 className="font-semibold text-[#e5e5e5] group-hover:text-[#4ade80] transition-colors">
                  {list.name}
                </h3>
                {list.description && (
                  <p className="text-sm text-[#525252] mt-1 line-clamp-2">{list.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
