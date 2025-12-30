/**
 * Demo Migration Project API
 *
 * Loads the Bedford crawl report as a demo project.
 *
 * Authorization: Admin only (Charter P2)
 */

import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { createProjectFromCrawlReport } from "@/lib/migration/project";
import { requireAdminOnly } from "@/lib/eventAuth";

export async function GET(req: NextRequest) {
  const auth = await requireAdminOnly(req);
  if (!auth.ok) return auth.response;

  try {
    // Try to load Bedford report
    const reportPath = path.join(
      process.cwd(),
      "scripts/migration/reports/bedford-crawl-report.json"
    );

    if (!fs.existsSync(reportPath)) {
      return NextResponse.json(
        { error: "No demo report found. Run the crawler first." },
        { status: 404 }
      );
    }

    const reportJson = fs.readFileSync(reportPath, "utf-8");
    const report = JSON.parse(reportJson);

    // Create project from report
    const project = createProjectFromCrawlReport(report, "Bedford Riding Lanes (Demo)");

    return NextResponse.json(project);
  } catch (error) {
    console.error("Failed to load demo project:", error);
    return NextResponse.json(
      { error: "Failed to load demo project" },
      { status: 500 }
    );
  }
}
