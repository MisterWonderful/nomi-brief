import { NextRequest, NextResponse } from "next/server";
import { prisma, upsertDefaultUser } from "@/lib/prisma";

// GET /api/items/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await upsertDefaultUser();
    const item = await prisma.listItem.findFirst({ where: { id, userId: user.id } });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to fetch item:", error);
    return NextResponse.json({ error: "Failed to fetch item" }, { status: 500 });
  }
}

// PATCH /api/items/[id] — update notes, tags, etc.
export async function PATCH(
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
    const item = await prisma.listItem.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title.trim() }),
        ...(body.description !== undefined && { description: body.description?.trim() || null }),
        ...(body.url !== undefined && { url: body.url?.trim() || null }),
        ...(body.image !== undefined && { image: body.image?.trim() || null }),
        ...(body.notes !== undefined && { notes: body.notes?.trim() || null }),
        ...(body.tags !== undefined && { tags: Array.isArray(body.tags) ? body.tags : [] }),
        ...(body.youtubeUrl !== undefined && { youtubeUrl: body.youtubeUrl?.trim() || null }),
        ...(body.richContent !== undefined && { richContent: body.richContent?.trim() || null }),
        ...(body.sourceUrl !== undefined && { sourceUrl: body.sourceUrl?.trim() || null }),
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to update item:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

// DELETE /api/items/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await upsertDefaultUser();

    const existing = await prisma.listItem.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    await prisma.listItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete item:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
