import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

    const where: any = {
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

    const orderBy: any = {
      newest: { publishedAt: "desc" },
      oldest: { publishedAt: "asc" },
      readTime: { readTime: "asc" },
    }[sort] || { publishedAt: "desc" };

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
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

// POST /api/articles - Create a new article
export async function POST(request: NextRequest) {
  try {
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
      userId,
      publishedAt,
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Use a default userId if not provided
    const targetUserId = userId || "default";

    // Verify user exists or create default
    let user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: targetUserId,
          email: "nomi@nomibrief.app",
          name: "Nomi Brief User",
        },
      });
    }

    const readTime = calculateReadTime(content);
    const excerpt = extractExcerpt(content);

    const article = await prisma.article.create({
      data: {
        title,
        subtitle: subtitle || excerpt,
        content,
        authorName,
        authorAvatar,
        coverImage,
        category,
        tags,
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
