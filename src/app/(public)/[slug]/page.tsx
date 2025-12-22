// Copyright (c) Santa Barbara Newcomers Club
// Public page rendering route - shows publishedContent only

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generateCssVariables, mergeTokensWithDefaults, ThemeTokens } from "@/lib/publishing/theme";
import { PageContent } from "@/lib/publishing/blocks";
import { selectContent } from "@/lib/publishing/contentSelection";
import BlockRenderer from "@/components/publishing/BlockRenderer";

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

  // Use content selection to get the published content (frozen snapshot)
  const selection = selectContent(
    page.content as PageContent | null,
    page.publishedContent as PageContent | null,
    "published"
  );

  // No published content available
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
    <main data-test-id="public-page" data-page-slug={slug}>
      <BlockRenderer content={selection.content} themeCss={themeCss} />
    </main>
  );
}
