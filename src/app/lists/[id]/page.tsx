import { prisma, upsertDefaultUser } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, ExternalLink } from "lucide-react";
import { ListDetailClient } from "./ListDetailClient";

export const dynamic = "force-dynamic";

export default async function ListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await upsertDefaultUser();

  const list = await prisma.list.findFirst({
    where: { id, userId: user.id },
    include: { items: { orderBy: { createdAt: "desc" } } },
  });

  if (!list) notFound();

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/lists"
        className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Lists
      </Link>

      {/* Client component handles everything interactive */}
      <ListDetailClient list={JSON.parse(JSON.stringify(list))} />
    </div>
  );
}
