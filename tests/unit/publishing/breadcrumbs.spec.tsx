// Copyright (c) Santa Barbara Newcomers Club
// Snapshot tests for Breadcrumbs component

import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/publishing/Breadcrumbs";

describe("Breadcrumbs", () => {
  describe("rendering", () => {
    it("renders nothing when items is null", () => {
      const html = renderToString(<Breadcrumbs items={null} />);
      expect(html).toBe("");
    });

    it("renders nothing when items is undefined", () => {
      const html = renderToString(<Breadcrumbs items={undefined} />);
      expect(html).toBe("");
    });

    it("renders nothing when items is empty array", () => {
      const html = renderToString(<Breadcrumbs items={[]} />);
      expect(html).toBe("");
    });

    it("renders single item as text (no link)", () => {
      const items: BreadcrumbItem[] = [{ label: "Home" }];
      const html = renderToString(<Breadcrumbs items={items} />);

      expect(html).toContain("Home");
      expect(html).toContain('aria-current="page"');
      expect(html).not.toContain("<a ");
    });

    it("renders multiple items with links for non-last items", () => {
      const items: BreadcrumbItem[] = [
        { label: "Home", href: "/" },
        { label: "Events", href: "/events" },
        { label: "Summer Picnic" },
      ];
      const html = renderToString(<Breadcrumbs items={items} />);

      expect(html).toContain('href="/"');
      expect(html).toContain('href="/events"');
      expect(html).toContain("Summer Picnic");
      expect(html).toContain('aria-current="page"');
    });

    it("renders item without href as text span", () => {
      const items: BreadcrumbItem[] = [
        { label: "Section" }, // No href
        { label: "Page" },
      ];
      const html = renderToString(<Breadcrumbs items={items} />);

      // First item has no href, so should be a span, not a link
      expect(html).toContain("Section");
      expect(html).toContain("Page");
    });

    it("includes accessible separator", () => {
      const items: BreadcrumbItem[] = [
        { label: "Home", href: "/" },
        { label: "Page" },
      ];
      const html = renderToString(<Breadcrumbs items={items} />);

      expect(html).toContain('aria-hidden="true"');
      expect(html).toContain("/"); // Default separator
    });

    it("uses custom separator", () => {
      const items: BreadcrumbItem[] = [
        { label: "Home", href: "/" },
        { label: "Page" },
      ];
      const html = renderToString(<Breadcrumbs items={items} separator=">" />);

      expect(html).toContain(">");
    });

    it("includes aria-label for navigation", () => {
      const items: BreadcrumbItem[] = [{ label: "Home" }];
      const html = renderToString(<Breadcrumbs items={items} />);

      expect(html).toContain('aria-label="Breadcrumb"');
    });

    it("includes test id", () => {
      const items: BreadcrumbItem[] = [{ label: "Home" }];
      const html = renderToString(<Breadcrumbs items={items} testId="custom-breadcrumbs" />);

      expect(html).toContain('data-testid="custom-breadcrumbs"');
    });
  });

  describe("snapshots", () => {
    it("matches snapshot with breadcrumbs", () => {
      const items: BreadcrumbItem[] = [
        { label: "Home", href: "/" },
        { label: "Events", href: "/events" },
        { label: "Summer Picnic 2025" },
      ];
      const html = renderToString(<Breadcrumbs items={items} />);

      expect(html).toMatchSnapshot();
    });

    it("matches snapshot without breadcrumbs", () => {
      const html = renderToString(<Breadcrumbs items={null} />);

      expect(html).toMatchSnapshot();
    });

    it("matches snapshot with single item", () => {
      const items: BreadcrumbItem[] = [{ label: "Dashboard" }];
      const html = renderToString(<Breadcrumbs items={items} />);

      expect(html).toMatchSnapshot();
    });
  });
});
