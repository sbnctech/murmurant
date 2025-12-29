// Copyright (c) Murmurant, Inc.
// JSON-LD structured data builders for SEO
// P2: Emit JSON-LD for public pages

/**
 * Site configuration for JSON-LD generation
 */
export type SiteConfig = {
  name: string;
  url: string;
  description?: string;
  logo?: string;
};

/**
 * Page data for JSON-LD generation
 */
export type PageData = {
  slug: string;
  title: string;
  description?: string | null;
  publishedAt?: Date | null;
  updatedAt?: Date | null;
};

/**
 * Breadcrumb item for JSON-LD
 */
export type BreadcrumbItem = {
  name: string;
  url: string;
};

/**
 * Build WebSite JSON-LD object
 * https://schema.org/WebSite
 */
export function buildWebSiteJsonLd(site: SiteConfig): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
    ...(site.description && { description: site.description }),
  };
}

/**
 * Build WebPage JSON-LD object
 * https://schema.org/WebPage
 */
export function buildWebPageJsonLd(page: PageData, site: SiteConfig): object {
  const pageUrl = `${site.url}/${page.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": pageUrl,
    url: pageUrl,
    name: page.title,
    ...(page.description && { description: page.description }),
    ...(page.publishedAt && { datePublished: page.publishedAt.toISOString() }),
    ...(page.updatedAt && { dateModified: page.updatedAt.toISOString() }),
    isPartOf: {
      "@type": "WebSite",
      "@id": site.url,
      name: site.name,
      url: site.url,
    },
  };
}

/**
 * Build BreadcrumbList JSON-LD object
 * https://schema.org/BreadcrumbList
 * Returns null if breadcrumbs is empty
 */
export function buildBreadcrumbJsonLd(
  breadcrumbs: BreadcrumbItem[]
): object | null {
  if (!breadcrumbs || breadcrumbs.length === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Build Organization JSON-LD object
 * https://schema.org/Organization
 */
export function buildOrganizationJsonLd(site: SiteConfig): object {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: site.url,
    ...(site.logo && { logo: site.logo }),
    ...(site.description && { description: site.description }),
  };
}

/**
 * Combine multiple JSON-LD objects into a @graph
 * This is the preferred format for multiple entities on a page
 */
export function combineJsonLd(objects: (object | null)[]): object {
  const filtered = objects.filter((obj): obj is object => obj !== null);

  if (filtered.length === 0) {
    return {};
  }

  if (filtered.length === 1) {
    return filtered[0];
  }

  // When combining, remove individual @context and use a single top-level one
  const items = filtered.map((obj) => {
    const { "@context": _, ...rest } = obj as Record<string, unknown>;
    return rest;
  });

  return {
    "@context": "https://schema.org",
    "@graph": items,
  };
}

/**
 * Serialize JSON-LD to a string safe for embedding in HTML
 * Escapes </script> to prevent XSS
 */
export function serializeJsonLd(obj: object): string {
  if (Object.keys(obj).length === 0) {
    return "";
  }

  const json = JSON.stringify(obj);
  // Escape </script> and </style> to prevent breaking out of script tag
  return json.replace(/<\/(script|style)/gi, "<\\/$1");
}
