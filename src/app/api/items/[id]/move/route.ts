import { NextRequest, NextResponse } from "next/server";
import { prisma, upsertDefaultUser } from "@/lib/prisma";

// POST /api/items/[id]/move — move item to another list
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await upsertDefaultUser();

    const existing = await prisma.listItem.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const body = await request.json();
    const { listId } = body;
    if (!listId) {
      return NextResponse.json({ error: "listId is required" }, { status: 400 });
    }

    // Verify target list exists and belongs to user
    const targetList = await prisma.list.findFirst({ where: { id: listId, userId: user.id } });
    if (!targetList) {
      return NextResponse.json({ error: "Target list not found" }, { status: 404 });
    }

    const item = await prisma.listItem.update({
      where: { id },
      data: { listId },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to move item:", error);
    return NextResponse.json({ error: "Failed to move item" }, { status: 500 });
  }
}
