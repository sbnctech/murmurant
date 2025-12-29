// Copyright (c) Murmurant, Inc.
// Unit tests for JSON-LD builders
// P2: JSON-LD structured metadata for public pages

import { describe, expect, test } from "vitest";
import {
  buildWebSiteJsonLd,
  buildWebPageJsonLd,
  buildBreadcrumbJsonLd,
  buildOrganizationJsonLd,
  combineJsonLd,
  serializeJsonLd,
  SiteConfig,
  PageData,
} from "@/lib/seo/jsonld";

const SITE_CONFIG: SiteConfig = {
  name: "Test Club",
  url: "https://example.org",
  description: "A test organization",
};

describe("buildWebSiteJsonLd", () => {
  test("produces valid WebSite schema", () => {
    const result = buildWebSiteJsonLd(SITE_CONFIG);

    expect(result).toEqual({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Test Club",
      url: "https://example.org",
      description: "A test organization",
    });
  });

  test("omits description when not provided", () => {
    const config: SiteConfig = { name: "Test", url: "https://test.com" };
    const result = buildWebSiteJsonLd(config);

    expect(result).not.toHaveProperty("description");
    expect(result).toEqual({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Test",
      url: "https://test.com",
    });
  });
});

describe("buildWebPageJsonLd", () => {
  test("produces valid WebPage schema with all fields", () => {
    const page: PageData = {
      slug: "about-us",
      title: "About Us",
      description: "Learn about our organization",
      publishedAt: new Date("2024-01-15T10:00:00Z"),
      updatedAt: new Date("2024-06-20T15:30:00Z"),
    };

    const result = buildWebPageJsonLd(page, SITE_CONFIG);

    expect(result).toEqual({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": "https://example.org/about-us",
      url: "https://example.org/about-us",
      name: "About Us",
      description: "Learn about our organization",
      datePublished: "2024-01-15T10:00:00.000Z",
      dateModified: "2024-06-20T15:30:00.000Z",
      isPartOf: {
        "@type": "WebSite",
        "@id": "https://example.org",
        name: "Test Club",
        url: "https://example.org",
      },
    });
  });

  test("omits optional fields when null", () => {
    const page: PageData = {
      slug: "contact",
      title: "Contact",
      description: null,
      publishedAt: null,
      updatedAt: null,
    };

    const result = buildWebPageJsonLd(page, SITE_CONFIG) as Record<string, unknown>;

    expect(result).not.toHaveProperty("description");
    expect(result).not.toHaveProperty("datePublished");
    expect(result).not.toHaveProperty("dateModified");
    expect(result.name).toBe("Contact");
  });

  test("omits optional fields when undefined", () => {
    const page: PageData = {
      slug: "faq",
      title: "FAQ",
    };

    const result = buildWebPageJsonLd(page, SITE_CONFIG) as Record<string, unknown>;

    expect(result).not.toHaveProperty("description");
    expect(result).not.toHaveProperty("datePublished");
    expect(result).not.toHaveProperty("dateModified");
  });
});

describe("buildBreadcrumbJsonLd", () => {
  test("produces valid BreadcrumbList schema", () => {
    const breadcrumbs = [
      { name: "Home", url: "https://example.org" },
      { name: "About", url: "https://example.org/about" },
      { name: "Team", url: "https://example.org/about/team" },
    ];

    const result = buildBreadcrumbJsonLd(breadcrumbs);

    expect(result).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://example.org" },
        { "@type": "ListItem", position: 2, name: "About", item: "https://example.org/about" },
        { "@type": "ListItem", position: 3, name: "Team", item: "https://example.org/about/team" },
      ],
    });
  });

  test("returns null for empty breadcrumbs", () => {
    expect(buildBreadcrumbJsonLd([])).toBeNull();
  });

  test("returns null for undefined breadcrumbs", () => {
    // @ts-expect-error - Testing runtime behavior
    expect(buildBreadcrumbJsonLd(undefined)).toBeNull();
  });
});

describe("buildOrganizationJsonLd", () => {
  test("produces valid Organization schema", () => {
    const config: SiteConfig = {
      name: "Test Org",
      url: "https://test.org",
      description: "A test",
      logo: "https://test.org/logo.png",
    };

    const result = buildOrganizationJsonLd(config);

    expect(result).toEqual({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Test Org",
      url: "https://test.org",
      description: "A test",
      logo: "https://test.org/logo.png",
    });
  });

  test("omits logo when not provided", () => {
    const result = buildOrganizationJsonLd(SITE_CONFIG) as Record<string, unknown>;

    expect(result).not.toHaveProperty("logo");
  });
});

describe("combineJsonLd", () => {
  test("returns single object unchanged when only one provided", () => {
    const single = buildWebSiteJsonLd(SITE_CONFIG);
    const result = combineJsonLd([single]);

    expect(result).toEqual(single);
  });

  test("combines multiple objects into @graph", () => {
    const site = buildWebSiteJsonLd(SITE_CONFIG);
    const page = buildWebPageJsonLd({ slug: "test", title: "Test" }, SITE_CONFIG);

    const result = combineJsonLd([site, page]) as Record<string, unknown>;

    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@graph"]).toHaveLength(2);

    // Verify @context removed from individual items
    const graph = result["@graph"] as object[];
    for (const item of graph) {
      expect(item).not.toHaveProperty("@context");
    }
  });

  test("filters out null values", () => {
    const site = buildWebSiteJsonLd(SITE_CONFIG);
    const nullBreadcrumb = buildBreadcrumbJsonLd([]);

    const result = combineJsonLd([site, nullBreadcrumb]);

    // Should return single object, not a graph
    expect(result).toEqual(site);
  });

  test("returns empty object when all inputs are null", () => {
    const result = combineJsonLd([null, null]);

    expect(result).toEqual({});
  });

  test("returns empty object for empty array", () => {
    const result = combineJsonLd([]);

    expect(result).toEqual({});
  });
});

describe("serializeJsonLd", () => {
  test("serializes to valid JSON string", () => {
    const obj = { "@type": "WebPage", name: "Test" };
    const result = serializeJsonLd(obj);

    expect(JSON.parse(result)).toEqual(obj);
  });

  test("escapes </script> to prevent XSS", () => {
    const obj = { content: "</script><script>alert('xss')</script>" };
    const result = serializeJsonLd(obj);

    expect(result).not.toContain("</script>");
    expect(result).toContain("<\\/script>");
  });

  test("escapes </style> tags", () => {
    const obj = { content: "</style>" };
    const result = serializeJsonLd(obj);

    expect(result).not.toContain("</style>");
    expect(result).toContain("<\\/style>");
  });

  test("returns empty string for empty object", () => {
    const result = serializeJsonLd({});

    expect(result).toBe("");
  });

  test("handles nested objects", () => {
    const obj = {
      "@type": "WebPage",
      isPartOf: {
        "@type": "WebSite",
        name: "Test",
      },
    };

    const result = serializeJsonLd(obj);
    expect(JSON.parse(result)).toEqual(obj);
  });
});

describe("JSON-LD output stability", () => {
  test("same input produces same output", () => {
    const page: PageData = {
      slug: "test-page",
      title: "Test Page",
      description: "A test",
      publishedAt: new Date("2024-01-01T00:00:00Z"),
    };

    const result1 = buildWebPageJsonLd(page, SITE_CONFIG);
    const result2 = buildWebPageJsonLd(page, SITE_CONFIG);

    expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
  });

  test("combined output is deterministic", () => {
    const site = buildWebSiteJsonLd(SITE_CONFIG);
    const page = buildWebPageJsonLd({ slug: "x", title: "X" }, SITE_CONFIG);

    const result1 = combineJsonLd([site, page]);
    const result2 = combineJsonLd([site, page]);

    expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
  });
});
