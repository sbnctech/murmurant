// Copyright (c) Santa Barbara Newcomers Club
// Public page rendering route

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generateCssVariables, mergeTokensWithDefaults, ThemeTokens } from "@/lib/publishing/theme";
import { PageContent, PageBreadcrumbItem } from "@/lib/publishing/blocks";
import BlockRenderer from "@/components/publishing/BlockRenderer";
import { Breadcrumbs, BreadcrumbItem } from "@/components/publishing/Breadcrumbs";

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
      seoTitle: true,
      seoDescription: true,
      seoImage: true,
    },
  });

  if (!page) {
    return { title: "Page Not Found" };
  }

  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || page.description,
    openGraph: page.seoImage ? { images: [page.seoImage] } : undefined,
  };
}

export default async function PublicPage({ params }: RouteParams) {
  const { slug } = await params;

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

  // Page not published
  if (page.status !== "PUBLISHED") {
    notFound();
  }

  // Page is members only - redirect to login
  if (page.visibility === "MEMBERS_ONLY" || page.visibility === "ROLE_RESTRICTED") {
    // For now, just show not found for protected pages
    // In production, this would redirect to login
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

  // Convert page breadcrumbs to component format
  // For public pages, all breadcrumbs are visible (no audience filtering needed)
  // page.breadcrumb is Json? in Prisma: null=off, []=enabled but empty, [{label,link?},...]=items
  const rawBreadcrumbs = page.breadcrumb as PageBreadcrumbItem[] | null;
  const breadcrumbItems: BreadcrumbItem[] | undefined = rawBreadcrumbs?.map(
    (item) => ({
      label: item.label,
      href: item.href,
    })
  );

  return (
    <main data-test-id="public-page" data-page-slug={slug}>
      <Breadcrumbs items={breadcrumbItems} testId="page-breadcrumbs" />
      <BlockRenderer content={content} themeCss={themeCss} />
    </main>
  );
}
