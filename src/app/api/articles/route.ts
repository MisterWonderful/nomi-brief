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
      hasMore: page * pageSize < total,
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
    const {
      title,
      subtitle,
      content,
      authorName = "Nomi Vale",
      authorAvatar,
      coverImage,
      category = "General",
      tags = [],
      source = "ai",
      sourceUrl,
      publishedAt,
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Validate content size (50KB max for articles)
    const contentSize = new TextEncoder().encode(content).length;
    if (contentSize > 50 * 1024) {
      return NextResponse.json(
        { error: "Article content exceeds maximum size of 50KB" },
        { status: 413 }
      );
    }

    // Use env-driven user upsert
    const user = await upsertDefaultUser();

    const readTime = calculateReadTime(content);
    const excerpt = extractExcerpt(content);

    const article = await prisma.article.create({
      data: {
        title: title.slice(0, 500), // Enforce max length
        subtitle: subtitle ? subtitle.slice(0, 1000) : excerpt,
        content,
        authorName: authorName.slice(0, 200),
        authorAvatar,
        coverImage,
        category: category.slice(0, 100),
        tags: tags.slice(0, 20).map((t: string) => t.slice(0, 100)),
        readTime,
        source,
        sourceUrl,
        userId: user.id,
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      },
    });

    return NextResponse.json({ data: article }, { status: 201 });
  } catch (error) {
    console.error("Error creating article:", error);
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
}
