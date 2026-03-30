import { NextRequest, NextResponse } from "next/server";
import { prisma, upsertDefaultUser } from "@/lib/prisma";

// POST /api/articles/delete — Delete an article by ID (server-side auth, no client secret needed)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Article ID required" }, { status: 400 });
    }

    const user = await upsertDefaultUser();

    // Verify the article belongs to this user before deleting
    const article = await prisma.article.findFirst({
      where: { id, userId: user.id },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    await prisma.article.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Article deleted", id });
  } catch (error) {
    console.error("Error deleting article:", error);
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });
  }
}
