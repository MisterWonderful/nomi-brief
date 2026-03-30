import { NextRequest, NextResponse } from "next/server";
import { prisma, upsertDefaultUser } from "@/lib/prisma";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function checkAuth(request: NextRequest): boolean {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) return true; // no secret configured = open
  const auth = request.headers.get("authorization") || "";
  if (auth === `Bearer ${secret}`) return true;
  // Also accept cookie-based sessions (for browser use)
  return false;
}

// GET /api/lists — all lists for user
export async function GET(request: NextRequest) {
  try {
    const user = await upsertDefaultUser();
    const lists = await prisma.list.findMany({
      where: { userId: user.id },
      include: { _count: { select: { items: true } } },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(lists);
  } catch (error) {
    console.error("Failed to fetch lists:", error);
    return NextResponse.json({ error: "Failed to fetch lists" }, { status: 500 });
  }
}

// POST /api/lists — create a list
export async function POST(request: NextRequest) {
  try {
    const user = await upsertDefaultUser();
    const body = await request.json();

    const { name, description, color, icon, sortOrder } = body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const list = await prisma.list.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || "violet",
        icon: icon || "bookmark",
        sortOrder: sortOrder ?? 0,
        userId: user.id,
      },
      include: { _count: { select: { items: true } } },
    });

    return NextResponse.json(list, { status: 201 });
  } catch (error) {
    console.error("Failed to create list:", error);
    return NextResponse.json({ error: "Failed to create list" }, { status: 500 });
  }
}
