import { NextRequest, NextResponse } from "next/server";
import { prisma, upsertDefaultUser } from "@/lib/prisma";

// GET /api/lists/[id]/items — get items in a list
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await upsertDefaultUser();

    const list = await prisma.list.findFirst({ where: { id, userId: user.id } });
    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    const items = await prisma.listItem.findMany({
      where: { listId: id, userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to fetch list items:", error);
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}

// POST /api/lists/[id]/items — add item to list
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await upsertDefaultUser();

    const list = await prisma.list.findFirst({ where: { id, userId: user.id } });
    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      description,
      url,
      image,
      notes,
      tags,
      youtubeUrl,
      richContent,
      sourceArticleId,
      sourceUrl,
    } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const item = await prisma.listItem.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        url: url?.trim() || null,
        image: image?.trim() || null,
        notes: notes?.trim() || null,
        tags: Array.isArray(tags) ? tags : [],
        youtubeUrl: youtubeUrl?.trim() || null,
        richContent: richContent?.trim() || null,
        sourceArticleId: sourceArticleId || null,
        sourceUrl: sourceUrl?.trim() || null,
        listId: id,
        userId: user.id,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Failed to add item:", error);
    return NextResponse.json({ error: "Failed to add item" }, { status: 500 });
  }
}
