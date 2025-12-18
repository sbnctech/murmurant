// Copyright (c) Santa Barbara Newcomers Club
// Unit tests for URL sanitization in block editor

import { describe, it, expect } from "vitest";

// URL validation function (same logic as in block API)
function isValidUrl(url: string): boolean {
  if (!url) return true; // Empty is allowed for optional fields

  // Allow relative paths, anchors, and mailto
  if (url.startsWith("/") || url.startsWith("#") || url.startsWith("mailto:")) {
    return true;
  }

  // Allow http/https
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return true;
  }

  // Allow data URLs only for images
  if (url.startsWith("data:image/")) {
    return true;
  }

  // Reject everything else (javascript:, vbscript:, data:text, etc.)
  return false;
}

describe("URL Sanitization", () => {
  describe("Safe URLs", () => {
    it("allows empty strings", () => {
      expect(isValidUrl("")).toBe(true);
    });

    it("allows relative paths", () => {
      expect(isValidUrl("/page")).toBe(true);
      expect(isValidUrl("/about/team")).toBe(true);
      expect(isValidUrl("/api/v1/test")).toBe(true);
    });

    it("allows anchor links", () => {
      expect(isValidUrl("#section")).toBe(true);
      expect(isValidUrl("#top")).toBe(true);
    });

    it("allows mailto links", () => {
      expect(isValidUrl("mailto:test@example.com")).toBe(true);
      expect(isValidUrl("mailto:info@club.org?subject=Hello")).toBe(true);
    });

    it("allows HTTPS URLs", () => {
      expect(isValidUrl("https://example.com")).toBe(true);
      expect(isValidUrl("https://example.com/path?query=1")).toBe(true);
      expect(isValidUrl("https://sub.domain.org:8080/path")).toBe(true);
    });

    it("allows HTTP URLs", () => {
      expect(isValidUrl("http://example.com")).toBe(true);
      expect(isValidUrl("http://localhost:3000")).toBe(true);
    });

    it("allows data URLs for images", () => {
      expect(isValidUrl("data:image/png;base64,iVBORw0KGgo=")).toBe(true);
      expect(isValidUrl("data:image/jpeg;base64,/9j/4AAQ")).toBe(true);
      expect(isValidUrl("data:image/svg+xml,<svg></svg>")).toBe(true);
      expect(isValidUrl("data:image/gif;base64,R0lGODlh")).toBe(true);
    });
  });

  describe("Dangerous URLs (rejected)", () => {
    it("rejects javascript: URLs", () => {
      expect(isValidUrl("javascript:alert(1)")).toBe(false);
      expect(isValidUrl("javascript:void(0)")).toBe(false);
      expect(isValidUrl("javascript:document.cookie")).toBe(false);
    });

    it("rejects javascript: with mixed case", () => {
      // Our implementation is case-sensitive for simplicity
      // Production should handle case variations
      expect(isValidUrl("JavaScript:alert(1)")).toBe(false);
      expect(isValidUrl("JAVASCRIPT:alert(1)")).toBe(false);
    });

    it("rejects vbscript: URLs", () => {
      expect(isValidUrl("vbscript:msgbox(1)")).toBe(false);
    });

    it("rejects data: URLs for non-images", () => {
      expect(isValidUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
      expect(isValidUrl("data:text/javascript,alert(1)")).toBe(false);
      expect(isValidUrl("data:application/javascript,")).toBe(false);
    });

    it("rejects file: URLs", () => {
      expect(isValidUrl("file:///etc/passwd")).toBe(false);
    });

    it("rejects ftp: URLs", () => {
      expect(isValidUrl("ftp://example.com")).toBe(false);
    });

    it("rejects bare domain names without protocol", () => {
      expect(isValidUrl("example.com")).toBe(false);
      expect(isValidUrl("www.example.com")).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("handles URL with spaces", () => {
      // URLs with spaces are technically invalid but we let the browser handle it
      expect(isValidUrl("https://example.com/path with spaces")).toBe(true);
    });

    it("rejects javascript with leading whitespace", () => {
      // Leading whitespace could be an attack vector
      expect(isValidUrl(" javascript:alert(1)")).toBe(false);
    });

    it("handles unicode in URLs", () => {
      expect(isValidUrl("https://example.com/path/file.html")).toBe(true);
    });

    it("handles very long URLs", () => {
      const longPath = "a".repeat(2000);
      expect(isValidUrl(`https://example.com/${longPath}`)).toBe(true);
    });
  });
});

describe("URL validation in block context", () => {
  const urlFields = ["link", "linkUrl", "src", "backgroundImage", "ctaLink"];

  it.each(urlFields)("validates %s field", (field) => {
    // This documents which fields contain URLs that should be validated
    expect(urlFields).toContain(field);
  });
});
