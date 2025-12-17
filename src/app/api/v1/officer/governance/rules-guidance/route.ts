/**
 * Rules Guidance API
 *
 * GET /api/v1/officer/governance/rules-guidance - List/search guidance
 * POST /api/v1/officer/governance/rules-guidance - Create guidance
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import {
  createRulesGuidance,
  listRulesGuidance,
  searchRulesGuidance,
  getGuidanceCategories,
} from "@/lib/governance/rulesGuidance";

/**
 * GET /api/v1/officer/governance/rules-guidance
 */
export async function GET(req: NextRequest) {
  const auth = await requireCapability(req, "meetings:motions:read");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const publishedOnly = searchParams.get("publishedOnly") !== "false";
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");
  const categoriesOnly = searchParams.get("categoriesOnly") === "true";
  const quickSearch = searchParams.get("quickSearch") === "true";

  try {
    // Return just categories
    if (categoriesOnly) {
      const categories = await getGuidanceCategories();
      return NextResponse.json({ categories });
    }

    // Quick search for autocomplete
    if (quickSearch && search) {
      const results = await searchRulesGuidance(search, 10);
      return NextResponse.json({ results });
    }

    // Full list
    const result = await listRulesGuidance({
      category: category || undefined,
      search: search || undefined,
      publishedOnly,
      limit,
      offset,
    });

    return NextResponse.json({
      guidance: result.guidance,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: offset + result.guidance.length < result.total,
      },
    });
  } catch (error) {
    console.error("Error listing rules guidance:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to list rules guidance" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/officer/governance/rules-guidance
 */
export async function POST(req: NextRequest) {
  const auth = await requireCapability(req, "governance:rules:manage");
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { title, category, content, tags } = body;

    if (!title || !category || !content) {
      return NextResponse.json(
        { error: "Bad Request", message: "title, category, and content are required" },
        { status: 400 }
      );
    }

    const guidance = await createRulesGuidance({
      title,
      category,
      content,
      tags: tags || [],
      createdById: auth.context.memberId,
    });

    return NextResponse.json({ guidance }, { status: 201 });
  } catch (error) {
    console.error("Error creating rules guidance:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to create rules guidance" },
      { status: 500 }
    );
  }
}
