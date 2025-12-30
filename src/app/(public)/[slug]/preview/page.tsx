// Copyright © 2025 Murmurant, Inc.
// Preview route - shows draft content for content admins

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generateCssVariables, mergeTokensWithDefaults, ThemeTokens } from "@/lib/publishing/theme";
import { PageContent } from "@/lib/publishing/blocks";
import { selectContent } from "@/lib/publishing/contentSelection";
import { buildUserContext, isContentAdmin } from "@/lib/publishing/permissions";
import BlockRenderer from "@/components/publishing/BlockRenderer";
import { getCurrentSession } from "@/lib/auth/session";

type RouteParams = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: RouteParams) {
  const { slug } = await params;

  const page = await prisma.page.findUnique({
    where: { slug },
    select: {
      title: true,
      description: true,
    },
  });

  if (!page) {
    return { title: "Page Not Found" };
  }

  return {
    title: `Preview: ${page.title}`,
    description: page.description,
  };
}

export default async function PreviewPage({ params }: RouteParams) {
  const { slug } = await params;

  // Check authentication
  const session = await getCurrentSession();
  if (!session) {
    redirect(`/login?redirect=/pages/${slug}/preview`);
  }

  // Look up memberId from the UserAccount
  const userAccount = await prisma.userAccount.findUnique({
    where: { id: session.userAccountId },
    select: { memberId: true },
  });

  const memberId = userAccount?.memberId ?? session.userAccountId;

  // Check authorization - must be content admin
  const userContext = await buildUserContext(memberId);
  if (!isContentAdmin(userContext)) {
    notFound();
  }

  // Fetch the page with theme
  const page = await prisma.page.findUnique({
    where: { slug },
    include: {
      theme: { select: { tokens: true, cssText: true } },
    },
  });

  // Page not found
  if (!page) {
    notFound();
  }

  // Use content selection in preview mode (prefer draft, fallback to published)
  const selection = selectContent(
    page.content as PageContent | null,
    page.publishedContent as PageContent | null,
    "preview"
  );

  // No content available to preview
  if (!selection.content) {
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

  return (
    <>
      {/* Preview banner */}
      <div
        data-test-id="preview-banner"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          backgroundColor: "#fff3cd",
          borderBottom: "1px solid #ffc107",
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "14px",
        }}
      >
        <span style={{ color: "#856404" }}>
          <strong>Preview Mode</strong>
          {selection.hasDraftChanges && " - This page has unpublished changes"}
          {page.status === "DRAFT" && " - This page is not yet published"}
        </span>
        <div style={{ display: "flex", gap: "12px" }}>
          <a
            href={`/admin/content/pages/${page.id}`}
            style={{ color: "#0066cc", textDecoration: "none" }}
          >
            Edit Page
          </a>
          {page.status === "PUBLISHED" && (
            <a
              href={`/pages/${slug}`}
              style={{ color: "#006600", textDecoration: "none" }}
            >
              View Published
            </a>
          )}
        </div>
      </div>

      <main data-test-id="preview-page" data-page-slug={slug}>
        <BlockRenderer content={selection.content} themeCss={themeCss} />
      </main>
    </>
  );
}
