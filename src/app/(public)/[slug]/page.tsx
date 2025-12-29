// Copyright (c) Santa Barbara Newcomers Club
// Public page rendering route - shows publishedContent only
// Enforces VisibilityRule and RoleGate at render time (Charter P2)
// P2: Emits JSON-LD structured data for SEO

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  generateCssVariables,
  mergeTokensWithDefaults,
  ThemeTokens,
} from "@/lib/publishing/theme";
import { PageContent } from "@/lib/publishing/blocks";
import { VisibilityUserContext } from "@/lib/publishing/visibility";
import { selectContent } from "@/lib/publishing/contentSelection";
import BlockRenderer from "@/components/publishing/BlockRenderer";
import { getCurrentSession } from "@/lib/auth/session";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  buildWebPageJsonLd,
  buildWebSiteJsonLd,
  combineJsonLd,
  SiteConfig,
} from "@/lib/seo/jsonld";
import { CLUB_WEBSITE_URL } from "@/lib/config/externalLinks";

// Site configuration for JSON-LD
const SITE_CONFIG: SiteConfig = {
  name: "Santa Barbara Newcomers Club",
  url: CLUB_WEBSITE_URL,
  description: "Welcoming newcomers to Santa Barbara since 1970",
};

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

/**
 * Build user context for visibility evaluation from member ID
 */
async function buildVisibilityContext(
  memberId: string | null
): Promise<VisibilityUserContext | null> {
  if (!memberId) {
    return null;
  }

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      membershipStatus: true,
      roleAssignments: {
        where: {
          OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
        },
        include: {
          committeeRole: true,
        },
      },
    },
  });

  if (!member) {
    return null;
  }

  return {
    isAuthenticated: true,
    membershipStatusCode: member.membershipStatus.code,
    roles: member.roleAssignments.map(
      (ra: { committeeRole: { slug: string } }) => ra.committeeRole.slug
    ),
    committeeIds: [
      ...new Set(
        member.roleAssignments.map(
          (ra: { committeeId: string }) => ra.committeeId
        )
      ),
    ] as string[],
  };
}

export default async function PublicPage({ params }: RouteParams) {
  const { slug } = await params;

  // Get current session for visibility evaluation
  const session = await getCurrentSession();

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
  if (
    page.visibility === "MEMBERS_ONLY" ||
    page.visibility === "ROLE_RESTRICTED"
  ) {
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

  // Build user context for visibility filtering
  // This enables block/section-level visibility controls
  const userContext = session
    ? await buildVisibilityContext(session.userAccountId)
    : null;

  // Get theme CSS
  let themeCss = "";
  if (page.theme) {
    const tokens = mergeTokensWithDefaults(page.theme.tokens as ThemeTokens);
    themeCss = `:root { ${generateCssVariables(tokens)} }`;
    if (page.theme.cssText) {
      themeCss += "\n" + page.theme.cssText;
    }
  }

  // P2: Build JSON-LD for public pages
  const jsonLdData = combineJsonLd([
    buildWebSiteJsonLd(SITE_CONFIG),
    buildWebPageJsonLd(
      {
        slug,
        title: page.title,
        description: page.description,
        publishedAt: page.publishedAt,
        updatedAt: page.updatedAt,
      },
      SITE_CONFIG
    ),
  ]);

  return (
    <>
      <JsonLd data={jsonLdData} />
      <main data-test-id="public-page" data-page-slug={slug}>
        <BlockRenderer
          content={selection.content}
          themeCss={themeCss}
          user={userContext}
        />
      </main>
    </>
  );
}
