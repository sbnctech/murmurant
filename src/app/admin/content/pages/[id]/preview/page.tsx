// Copyright (c) Santa Barbara Newcomers Club
// Admin preview route for unpublished pages

import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { generateCssVariables, mergeTokensWithDefaults, ThemeTokens } from "@/lib/publishing/theme";
import { PageContent, PageBreadcrumbItem } from "@/lib/publishing/blocks";
import BlockRenderer from "@/components/publishing/BlockRenderer";
import { Breadcrumbs, BreadcrumbItem } from "@/components/publishing/Breadcrumbs";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: RouteParams) {
  const { id } = await params;

  const page = await prisma.page.findUnique({
    where: { id },
    select: { title: true },
  });

  if (!page) {
    return { title: "Preview Not Found" };
  }

  return {
    title: `Preview: ${page.title}`,
    robots: "noindex, nofollow", // Admin preview should not be indexed
  };
}

export default async function PagePreview({ params }: RouteParams) {
  const { id } = await params;

  // Check for admin token (simplified for preview)
  const cookieStore = await cookies();
  const adminToken = cookieStore.get("x-admin-test-token");

  // In production, this would check proper admin auth
  // For now, we allow preview if any session exists or test token is present
  const hasAccess = adminToken || cookieStore.get("member_session");

  if (!hasAccess) {
    return (
      <main data-test-id="preview-unauthorized" style={{ padding: "40px", textAlign: "center" }}>
        <h1 style={{ fontSize: "24px", marginBottom: "16px" }}>Preview Unauthorized</h1>
        <p style={{ color: "#666" }}>
          You must be logged in as an admin to preview pages.
        </p>
        <Link href="/admin" style={{ color: "#0066cc", marginTop: "16px", display: "inline-block" }}>
          Go to Admin
        </Link>
      </main>
    );
  }

  // Fetch the page by ID with theme and breadcrumbs
  const page = await prisma.page.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      status: true,
      visibility: true,
      content: true,
      breadcrumb: true,
      theme: { select: { tokens: true, cssText: true } },
    },
  });

  // Page not found
  if (!page) {
    notFound();
  }

  // Get theme CSS
  let themeCss = "";
  if (page.theme) {
    const tokens = mergeTokensWithDefaults(page.theme.tokens as ThemeTokens);
    themeCss = `:root { ${generateCssVariables(tokens)} }`;
    if (page.theme.cssText) {
      themeCss += "\n" + page.theme.cssText;
    }
  }

  const content = page.content as PageContent;

  // Convert breadcrumb data to component format (null means disabled, array means enabled)
  const breadcrumbItems: BreadcrumbItem[] | null = page.breadcrumb
    ? (page.breadcrumb as PageBreadcrumbItem[]).map((item) => ({
        label: item.label,
        href: item.href,
      }))
    : null;

  return (
    <div data-test-id="page-preview-container">
      {/* Preview banner */}
      <div
        data-test-id="preview-banner"
        style={{
          backgroundColor: "#fef3c7",
          borderBottom: "1px solid #f59e0b",
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontWeight: 500, color: "#92400e" }}>
          Preview Mode - {page.status === "DRAFT" ? "Draft" : page.status}
        </span>
        <Link
          href={`/admin/content/pages`}
          style={{
            color: "#92400e",
            textDecoration: "underline",
          }}
        >
          Back to Pages
        </Link>
      </div>

      {/* Page content */}
      <main data-test-id="page-preview" data-page-id={id} data-page-slug={page.slug}>
        {breadcrumbItems !== null && (
          <Breadcrumbs items={breadcrumbItems} testId="preview-breadcrumbs" />
        )}
        <BlockRenderer content={content} themeCss={themeCss} />
      </main>
    </div>
  );
}
