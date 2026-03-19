import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateReadTime, extractExcerpt } from "@/lib/utils";

// POST /api/webhook - Receive articles from OpenClaw
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate webhook secret if configured
    const webhookSecret = process.env.WEBHOOK_SECRET;
    const authHeader = request.headers.get("authorization");
    
    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { type, payload } = body;

    // Only handle article submissions for now
    if (type !== "article") {
      return NextResponse.json({
        message: "Accepted but only 'article' type is supported",
        received: true,
      });
    }

    const {
      title,
      subtitle,
      content,
      authorName = "Nomi Vale",
      authorAvatar,
      coverImage,
      category = "AI & Technology",
      tags = [],
      source = "ai",
      sourceUrl,
      publishedAt,
    } = payload;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Use upsert pattern for default user to avoid unique constraint violations
    const user = await prisma.user.upsert({
      where: { email: "nomi@nomibrief.app" },
      update: {},
      create: {
        email: "nomi@nomibrief.app",
        name: "Ryan",
        avatar: "https://avatars.githubusercontent.com/u/20233821?v=4",
      },
    });

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

    return NextResponse.json({
      success: true,
      message: "Article created successfully",
      articleId: article.id,
    }, { status: 201 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

// GET /api/webhook - Verify webhook endpoint
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get("challenge");

  if (challenge) {
    return NextResponse.json({ challenge });
  }

  return NextResponse.json({
    status: "ok",
    message: "Nomi Brief webhook endpoint is active",
    documentation: {
      endpoint: "POST /api/webhook",
      contentType: "application/json",
      body: {
        type: "article",
        payload: {
          title: "string (required)",
          content: "string (required)",
          subtitle: "string (optional)",
          authorName: "string (default: Nomi Vale)",
          coverImage: "string (optional)",
          category: "string (default: AI & Technology)",
          tags: "string[] (optional)",
          source: "string (default: ai)",
          sourceUrl: "string (optional)",
          publishedAt: "ISO date string (optional)",
        },
      },
    },
  });
}
