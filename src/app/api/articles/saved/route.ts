import { NextRequest, NextResponse } from "next/server";
import { prisma, upsertDefaultUser } from "@/lib/prisma";

// GET /api/articles/saved — List all saved articles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const user = await upsertDefaultUser();
    const where = { userId: user.id, isSaved: true, isPublished: true };

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: { savedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true, title: true, subtitle: true, authorName: true,
          coverImage: true, category: true, tags: true, readTime: true,
          publishedAt: true, isRead: true, isFavorite: true, isSaved: true,
          savedAt: true, source: true, sourceUrl: true,
        },
      }),
      prisma.article.count({ where }),
    ]);

    return NextResponse.json({
      data: articles,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Error fetching saved articles:", error);
    return NextResponse.json({ error: "Failed to fetch saved articles" }, { status: 500 });
  }
}

// POST /api/articles/saved — Save an article (or unsave if already saved)
export async function POST(request: NextRequest) {
  try {
    const user = await upsertDefaultUser();
    const { id } = await request.json();

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Article ID required" }, { status: 400 });
    }

    const article = await prisma.article.findFirst({
      where: { id, userId: user.id },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const updated = await prisma.article.update({
      where: { id },
      data: {
        isSaved: !article.isSaved,
        savedAt: !article.isSaved ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      isSaved: updated.isSaved,
      savedAt: updated.savedAt,
    });
  } catch (error) {
    console.error("Error saving article:", error);
    return NextResponse.json({ error: "Failed to save article" }, { status: 500 });
  }
}
