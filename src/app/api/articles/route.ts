import { NextRequest, NextResponse } from "next/server";
import { prisma, upsertDefaultUser } from "@/lib/prisma";
import { calculateReadTime, extractExcerpt } from "@/lib/utils";

// GET /api/articles - List all articles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "newest";
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const where: Record<string, unknown> = {
      isPublished: true,
    };

    if (category) {
      where.category = category;
    }

    if (tag) {
      where.tags = { has: tag };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { subtitle: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    if (unreadOnly) {
      where.isRead = false;
    }

    const orderBy =
      sort === "oldest"
        ? { publishedAt: "asc" as const }
        : sort === "readTime"
          ? { readTime: "asc" as const }
          : { publishedAt: "desc" as const };

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          subtitle: true,
          authorName: true,
          authorAvatar: true,
          coverImage: true,
          category: true,
          tags: true,
          readTime: true,
          publishedAt: true,
          isRead: true,
          isFavorite: true,
          source: true,
          sourceUrl: true,
          createdAt: true,
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
    console.error("Error fetching articles:", error);
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
  }
}

// POST /api/articles - Create a new article
export async function POST(request: NextRequest) {
  try {
    const apiSecret = process.env.API_SECRET;

    // Fail-safe: block writes if API_SECRET is not configured
    if (!apiSecret) {
      console.error("API_SECRET is not configured — rejecting write request");
      return NextResponse.json(
        {
          error:
            "API_SECRET environment variable is not configured. Cannot accept writes.",
        },
        { status: 503 }
      );
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader || authHeader !== `Bearer ${apiSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id: requestedId, ...data } = body;

    const user = await upsertDefaultUser();
    const readTime = calculateReadTime(data.content || "");
    const excerpt = extractExcerpt(data.content || "");

    // Use provided ID or generate new one
    const articleId = requestedId || undefined;

    const article = await prisma.article.create({
      data: {
        id: articleId,
        title: (data.title || "Untitled").slice(0, 500),
        subtitle: data.subtitle ? data.subtitle.slice(0, 1000) : excerpt,
        content: data.content || "",
        authorName: (data.authorName || "Nomi Vale").slice(0, 200),
        authorAvatar: data.authorAvatar,
        coverImage: data.coverImage || null,
        category: (data.category || "General").slice(0, 100),
        tags: (data.tags || []).slice(0, 20).map((t: string) => String(t).slice(0, 100)),
        readTime: data.readTime || readTime,
        source: data.source || "api",
        sourceUrl: data.sourceUrl || null,
        userId: user.id,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : new Date(),
      },
    });

    return NextResponse.json({ data: article }, { status: 201 });
  } catch (error) {
    console.error("Error creating article:", error);
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
  }
}

// DELETE /api/articles?id=xxx - Delete an article
export async function DELETE(request: NextRequest) {
  try {
    const apiSecret = process.env.API_SECRET;
    if (!apiSecret) {
      return NextResponse.json({ error: "API_SECRET not configured" }, { status: 503 });
    }
    const authHeader = request.headers.get("authorization");
    if (!authHeader || authHeader !== `Bearer ${apiSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Article ID required" }, { status: 400 });
    }

    const user = await upsertDefaultUser();
    await prisma.article.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ success: true, message: "Article deleted" });
  } catch (error) {
    console.error("Error deleting article:", error);
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });
  }
}
