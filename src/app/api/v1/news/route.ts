/**
 * News Feed API
 *
 * Aggregates published content from multiple sources (Pages, Announcements, Events)
 * and filters by user's role/membership via AudienceRule evaluation.
 *
 * GET /api/v1/news
 *   ?sources=pages,announcements,events  (comma-separated, default: all)
 *   ?categories=club-news,events         (comma-separated, optional)
 *   ?limit=10                            (default: 10, max: 50)
 *   ?includeExpired=false                (default: false)
 *
 * Returns news items visible to the authenticated user based on RBAC.
 * Unauthenticated users see only PUBLIC content.
 *
 * Charter: P2 (default deny, role-based filtering), P1 (audit trail)
 *
 * Copyright (c) Murmurant, Inc.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { buildUserContext, canViewPage, type UserContext } from "@/lib/publishing/permissions";

// News item returned by the API
interface NewsItem {
  id: string;
  source: "page" | "announcement" | "event";
  sourceId: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  publishedAt: string;
  expiresAt: string | null;
  href: string | null;
  isPinned: boolean;
  groupName: string | null; // For announcements
}

// Valid source types
type NewsSource = "pages" | "announcements" | "events";
const VALID_SOURCES: NewsSource[] = ["pages", "announcements", "events"];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Parse query parameters
  const sourcesParam = searchParams.get("sources");
  const categoriesParam = searchParams.get("categories");
  const limitParam = searchParams.get("limit");
  const includeExpired = searchParams.get("includeExpired") === "true";

  // Parse sources (default: all)
  let sources: NewsSource[] = VALID_SOURCES;
  if (sourcesParam) {
    const requested = sourcesParam.split(",").map((s) => s.trim().toLowerCase());
    sources = requested.filter((s): s is NewsSource =>
      VALID_SOURCES.includes(s as NewsSource)
    );
    if (sources.length === 0) {
      sources = VALID_SOURCES;
    }
  }

  // Parse categories (optional filter)
  const categories = categoriesParam
    ? categoriesParam.split(",").map((c) => c.trim().toLowerCase())
    : null;

  // Parse limit (default: 10, max: 50)
  const limit = Math.min(50, Math.max(1, parseInt(limitParam || "10", 10)));

  const now = new Date();
  const newsItems: NewsItem[] = [];

  // Get auth context for RBAC filtering (allow unauthenticated)
  let userContext: UserContext;
  const authResult = await requireAuth(request);

  if (authResult.ok) {
    userContext = await buildUserContext(authResult.context.memberId);
  } else {
    // Unauthenticated - build empty context
    userContext = {
      memberId: null,
      isAuthenticated: false,
      membershipStatusCode: null,
      roles: [],
      committeeIds: [],
    };
  }

  try {
    // Fetch from each source in parallel
    const [pageItems, announcementItems, eventItems] = await Promise.all([
      sources.includes("pages") ? fetchPageNews(now, userContext, categories) : [],
      sources.includes("announcements") ? fetchAnnouncementNews(now, userContext, categories, includeExpired) : [],
      sources.includes("events") ? fetchEventNews(now, categories) : [],
    ]);

    newsItems.push(...pageItems, ...announcementItems, ...eventItems);

    // Sort by publishedAt (newest first), with pinned items at top
    newsItems.sort((a, b) => {
      // Pinned items first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // Then by date
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    // Apply limit
    const result = newsItems.slice(0, limit);

    return NextResponse.json({
      items: result,
      meta: {
        total: newsItems.length,
        returned: result.length,
        sources,
        categories,
      },
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}

/**
 * Fetch published pages as news items
 */
async function fetchPageNews(
  now: Date,
  userContext: UserContext,
  categories: string[] | null
): Promise<NewsItem[]> {
  // Fetch published pages
  const pages = await prisma.page.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { publishAt: null },
        { publishAt: { lte: now } },
      ],
    },
    include: {
      audienceRule: true,
    },
    orderBy: { publishedAt: "desc" },
    take: 50, // Pre-filter limit
  });

  const items: NewsItem[] = [];

  for (const page of pages) {
    // Check visibility using existing permission system
    const canView = await canViewPage(userContext, page);
    if (!canView) continue;

    // Extract category from slug or metadata
    const category = extractPageCategory(page.slug);

    // Apply category filter if specified
    if (categories && category && !categories.includes(category.toLowerCase())) {
      continue;
    }

    // Extract excerpt from description or content
    const excerpt = page.description || extractExcerpt(page.publishedContent);

    items.push({
      id: `page-${page.id}`,
      source: "page",
      sourceId: page.id,
      title: page.title,
      excerpt,
      category,
      publishedAt: (page.publishedAt || page.createdAt).toISOString(),
      expiresAt: null,
      href: `/${page.slug}`,
      isPinned: false,
      groupName: null,
    });
  }

  return items;
}

/**
 * Fetch activity group announcements as news items
 */
async function fetchAnnouncementNews(
  now: Date,
  userContext: UserContext,
  categories: string[] | null,
  includeExpired: boolean
): Promise<NewsItem[]> {
  // Build where clause for announcements
  const where: {
    OR?: Array<{ expiresAt: null } | { expiresAt: { gte: Date } }>;
    group?: {
      status: "APPROVED";
      OR?: Array<
        | { members: { some: { memberId: string; leftAt: null } } }
        | { isPublic: true }
      >;
      isPublic?: boolean;
    };
  } = {};

  if (!includeExpired) {
    where.OR = [
      { expiresAt: null },
      { expiresAt: { gte: now } },
    ];
  }

  // Filter by group visibility
  if (userContext.memberId) {
    // User can see announcements from groups they're a member of, or public groups
    where.group = {
      status: "APPROVED",
      OR: [
        { members: { some: { memberId: userContext.memberId, leftAt: null } } },
        { isPublic: true },
      ],
    };
  } else {
    // Unauthenticated: only public groups
    where.group = {
      status: "APPROVED",
      isPublic: true,
    };
  }

  const announcements = await prisma.activityGroupAnnouncement.findMany({
    where,
    include: {
      group: {
        select: { id: true, name: true, slug: true },
      },
    },
    orderBy: [
      { isPinned: "desc" },
      { publishedAt: "desc" },
    ],
    take: 50,
  });

  const items: NewsItem[] = [];

  for (const ann of announcements) {
    // Apply category filter if specified
    const category = "group-update";
    if (categories && !categories.includes(category)) {
      continue;
    }

    items.push({
      id: `announcement-${ann.id}`,
      source: "announcement",
      sourceId: ann.id,
      title: ann.title,
      excerpt: extractExcerpt(ann.content),
      category,
      publishedAt: ann.publishedAt.toISOString(),
      expiresAt: ann.expiresAt?.toISOString() || null,
      href: `/groups/${ann.group.slug}`,
      isPinned: ann.isPinned,
      groupName: ann.group.name,
    });
  }

  return items;
}

/**
 * Fetch upcoming events as news items
 */
async function fetchEventNews(
  now: Date,
  categories: string[] | null
): Promise<NewsItem[]> {
  // Fetch upcoming published events
  const events = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      startTime: { gte: now },
    },
    orderBy: { startTime: "asc" },
    take: 20,
  });

  const items: NewsItem[] = [];

  for (const event of events) {
    // Apply category filter if specified
    const category = "upcoming-event";
    if (categories && !categories.includes(category)) {
      continue;
    }

    // Use enewsBlurbDraft if available, otherwise description
    const excerpt = event.enewsBlurbDraft || event.description || null;

    items.push({
      id: `event-${event.id}`,
      source: "event",
      sourceId: event.id,
      title: event.title,
      excerpt,
      category,
      publishedAt: event.publishedAt?.toISOString() || event.createdAt.toISOString(),
      expiresAt: event.startTime.toISOString(), // Expires after event starts
      href: `/events/${event.id}`,
      isPinned: false,
      groupName: null,
    });
  }

  return items;
}

/**
 * Extract category from page slug
 */
function extractPageCategory(slug: string): string | null {
  // Common patterns: "news/article-title", "announcements/something"
  const parts = slug.split("/");
  if (parts.length > 1) {
    const prefix = parts[0].toLowerCase();
    if (["news", "announcements", "updates", "blog"].includes(prefix)) {
      return prefix;
    }
  }
  return "page";
}

/**
 * Extract excerpt from content (handles JSON block content or plain text)
 */
function extractExcerpt(content: unknown, maxLength = 200): string | null {
  if (!content) return null;

  let text = "";

  if (typeof content === "string") {
    text = content;
  } else if (typeof content === "object") {
    // Try to extract text from block-based content
    try {
      const blocks = Array.isArray(content) ? content : [];
      for (const block of blocks) {
        if (block?.type === "paragraph" && block?.content) {
          text += extractTextFromBlock(block.content) + " ";
        }
        if (text.length > maxLength) break;
      }
    } catch {
      return null;
    }
  }

  // Clean and truncate
  text = text.replace(/\s+/g, " ").trim();
  if (text.length > maxLength) {
    text = text.substring(0, maxLength - 3) + "...";
  }

  return text || null;
}

/**
 * Extract text from block content (recursive)
 */
function extractTextFromBlock(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map(extractTextFromBlock).join("");
  }
  if (typeof content === "object" && content !== null) {
    const obj = content as Record<string, unknown>;
    if ("text" in obj && typeof obj.text === "string") {
      return obj.text;
    }
    if ("content" in obj) {
      return extractTextFromBlock(obj.content);
    }
  }
  return "";
}
