/**
 * GET /api/openapi.json
 *
 * Serves the OpenAPI specification as JSON.
 * Admin-protected endpoint for internal documentation.
 *
 * This endpoint:
 * - Loads the canonical OpenAPI spec from docs/api/openapi.yaml
 * - Converts YAML to JSON
 * - Requires admin:full capability
 *
 * Charter compliance:
 * - P1 (Identity provable): Requires admin authentication
 * - P2 (Default deny): Only admin can access
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import * as yaml from "js-yaml";
import * as fs from "fs";
import * as path from "path";

// Cache the parsed spec to avoid re-reading on every request
let cachedSpec: object | null = null;
let cachedMtime: number | null = null;

function getOpenApiSpec(): object {
  const specPath = path.join(process.cwd(), "docs", "api", "openapi.yaml");

  // Check if file has been modified since last cache
  try {
    const stats = fs.statSync(specPath);
    const mtime = stats.mtimeMs;

    if (cachedSpec && cachedMtime === mtime) {
      return cachedSpec;
    }

    const fileContents = fs.readFileSync(specPath, "utf8");
    const spec = yaml.load(fileContents) as object;

    // Update cache
    cachedSpec = spec;
    cachedMtime = mtime;

    return spec;
  } catch (error) {
    console.error("Error loading OpenAPI spec:", error);
    throw new Error("Failed to load OpenAPI specification");
  }
}

export async function GET(request: NextRequest) {
  // Require admin capability
  const auth = await requireCapability(request, "admin:full");
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const spec = getOpenApiSpec();

    return NextResponse.json(spec, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=60", // Cache for 1 minute
      },
    });
  } catch (error) {
    console.error("Error serving OpenAPI spec:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to load OpenAPI specification",
      },
      { status: 500 }
    );
  }
}
