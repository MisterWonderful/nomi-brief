import { NextRequest, NextResponse } from "next/server";
import { prisma, upsertDefaultUser } from "@/lib/prisma";
import { validateUrl } from "@/lib/utils";

// GET /api/links - List all links
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");
    const favoritesOnly = searchParams.get("favorites") === "true";

    const user = await upsertDefaultUser();
    const where: Record<string, unknown> = { userId: user.id };

    if (category) {
      where.category = category;
    }

    if (tag) {
      where.tags = { has: tag };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { url: { contains: search, mode: "insensitive" } },
      ];
    }

    if (favoritesOnly) {
      where.isFavorite = true;
    }

    const [links, total] = await Promise.all([
      prisma.linkEntry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.linkEntry.count({ where }),
    ]);

    return NextResponse.json({ data: links, total, page, pageSize, hasMore: page * pageSize < total });
  } catch (error) {
    console.error("Error fetching links:", error);
    return NextResponse.json({ error: "Failed to fetch links" }, { status: 500 });
  }
}

// POST /api/links - Create a new link
export async function POST(request: NextRequest) {
  try {
    const apiSecret = process.env.API_SECRET;

    if (!apiSecret) {
      return NextResponse.json(
        { error: "API_SECRET environment variable is not configured. Cannot accept writes." },
        { status: 503 }
      );
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader || authHeader !== `Bearer ${apiSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, url, description, image, source, sourceUrl, tags, category, articleId } = body;

    if (!title || !url) {
      return NextResponse.json({ error: "Title and URL are required" }, { status: 400 });
    }

    if (!validateUrl(url)) {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    const user = await upsertDefaultUser();

    const link = await prisma.linkEntry.create({
      data: {
        title: title.slice(0, 500),
        url,
        description: description ? description.slice(0, 2000) : null,
        image,
        source: source || "manual",
        sourceUrl,
        tags: (tags || []).slice(0, 20).map((t: string) => String(t).slice(0, 100)),
        category: category?.slice(0, 100) || null,
        userId: user.id,
        articleId: articleId || null,
      },
    });

    return NextResponse.json({ data: link }, { status: 201 });
  } catch (error) {
    console.error("Error creating link:", error);
    return NextResponse.json({ error: "Failed to create link" }, { status: 500 });
  }
}
