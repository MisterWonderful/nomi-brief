import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma, upsertDefaultUser } from "@/lib/prisma";
import { calculateReadTime, extractExcerpt } from "@/lib/utils";

/**
 * Timing-safe comparison for webhook secrets.
 * Uses crypto.timingSafeEqual to prevent timing attacks.
 */
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do a comparison to maintain constant time for auth failures
    createHmac("sha256", "dummy").update(a).digest();
    return false;
  }
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return timingSafeEqual(bufA, bufB);
}

// POST /api/webhook - Receive articles from OpenClaw
export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.WEBHOOK_SECRET;
    const authHeader = request.headers.get("authorization") || "";

    // If WEBHOOK_SECRET is configured, validate it with timing-safe compare
    if (webhookSecret) {
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
      }
      const token = authHeader.slice(7); // Strip "Bearer " prefix
      if (!secureCompare(token, webhookSecret)) {
        return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 });
      }
    } else {
      // No secret configured — log a warning but allow (for dev setups)
      console.warn(
        "[webhook] WEBHOOK_SECRET not configured. "
      );
    }

    const body = await request.json();
    const { type, payload } = body;

    // Only handle article submissions
    if (type !== "article") {
      return NextResponse.json(
        {
          error: `Unsupported webhook type: '${type}'. Only 'article' is supported.`,
          received: false,
        },
        { status: 422 }
      );
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
        { error: "Title and content are required in payload" },
        { status: 400 }
      );
    }

    // Enforce content size limit (50KB max)
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
        title: title.slice(0, 500),
        subtitle: subtitle ? subtitle.slice(0, 1000) : excerpt,
        content,
        authorName: authorName.slice(0, 200),
        authorAvatar,
        coverImage,
        category: category.slice(0, 100),
        tags: (tags || []).slice(0, 20).map((t: string) => String(t).slice(0, 100)),
        readTime,
        source,
        sourceUrl,
        userId: user.id,
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Article created successfully",
        articleId: article.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
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
    secured: Boolean(process.env.WEBHOOK_SECRET),
    documentation: {
      endpoint: "POST /api/webhook",
      contentType: "application/json",
      body: {
        type: "article",
        payload: {
          title: "string (required)",
          content: "string (required, max 50KB)",
          subtitle: "string (optional)",
          authorName: "string (default: Nomi Vale)",
          coverImage: "string (optional)",
          category: "string (default: AI & Technology)",
          tags: "string[] (optional, max 20)",
          source: "string (default: ai)",
          sourceUrl: "string (optional)",
          publishedAt: "ISO date string (optional)",
        },
      },
      auth: process.env.WEBHOOK_SECRET
        ? "Bearer token required in Authorization header"
        : "No authentication configured (set WEBHOOK_SECRET to secure)",
    },
  });
}
