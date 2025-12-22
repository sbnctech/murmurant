// Copyright (c) Santa Barbara Newcomers Club
// Member-only page rendering route

import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { generateCssVariables, mergeTokensWithDefaults, ThemeTokens } from "@/lib/publishing/theme";
import { PageContent, PageBreadcrumbItem } from "@/lib/publishing/blocks";
import { buildUserContext, canViewPage } from "@/lib/publishing/permissions";
import BlockRenderer from "@/components/publishing/BlockRenderer";
import { Breadcrumbs, BreadcrumbItem } from "@/components/publishing/Breadcrumbs";

type RouteParams = {
  params: Promise<{ slug: string }>;
};

async function getMemberIdFromSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("member_session");
  if (!sessionCookie?.value) return null;

  // In production, this would validate the session token
  // For now, we treat the cookie value as the member ID
  return sessionCookie.value;
}

export async function generateMetadata({ params }: RouteParams) {
  const { slug } = await params;

  const page = await prisma.page.findUnique({
    where: { slug },
    select: {
      title: true,
      description: true,
      seoTitle: true,
      seoDescription: true,
    },
  });

  if (!page) {
    return { title: "Page Not Found" };
  }

  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || page.description,
  };
}

export default async function MemberPage({ params }: RouteParams) {
  const { slug } = await params;

  // Check authentication
  const memberId = await getMemberIdFromSession();
  if (!memberId) {
    redirect("/login?redirect=/member/" + slug);
  }

  // Fetch the page with theme, audience rule, and breadcrumbs
  const page = await prisma.page.findUnique({
    where: { slug },
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
      audienceRule: { select: { rules: true } },
    },
  });

  // Page not found
  if (!page) {
    notFound();
  }

  // Page not published
  if (page.status !== "PUBLISHED") {
    notFound();
  }

  // Check if user can view this page
  const userContext = await buildUserContext(memberId);
  // Type assertion needed: Prisma select returns partial type, but canViewPage only needs
  // visibility and audienceRule fields which are included in the select
  const canView = await canViewPage(userContext, page as unknown as Parameters<typeof canViewPage>[1]);

  if (!canView) {
    // User doesn't have permission to view this page
    return (
      <main data-test-id="member-page-forbidden" style={{ padding: "40px", textAlign: "center" }}>
        <h1 style={{ fontSize: "24px", marginBottom: "16px" }}>Access Restricted</h1>
        <p style={{ color: "#666" }}>
          You don&apos;t have permission to view this page.
        </p>
        <Link href="/member" style={{ color: "#0066cc", marginTop: "16px", display: "inline-block" }}>
          Return to member dashboard
        </Link>
      </main>
    );
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
    <main data-test-id="member-page" data-page-slug={slug}>
      {breadcrumbItems !== null && (
        <Breadcrumbs items={breadcrumbItems} testId="page-breadcrumbs" />
      )}
      <BlockRenderer content={content} themeCss={themeCss} />
    </main>
  );
}
