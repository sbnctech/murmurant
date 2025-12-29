/**
 * Unit tests for brand components
 *
 * Tests that brand components render correctly using server-side rendering.
 * Uses ReactDOMServer to test React components in Node.js environment.
 */

import { describe, it, expect } from "vitest";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { MurmurantLogo, MurmurantBug, MurmurantWordmark } from "@/components/brand";

describe("Brand Components", () => {
  describe("MurmurantLogo", () => {
    it("renders without crashing", () => {
      const html = ReactDOMServer.renderToString(React.createElement(MurmurantLogo));
      expect(html).toBeDefined();
      expect(html.length).toBeGreaterThan(0);
    });

    it("accepts size prop", () => {
      const html = ReactDOMServer.renderToString(
        React.createElement(MurmurantLogo, { size: "lg" })
      );
      expect(html).toBeDefined();
    });

    it("accepts variant prop", () => {
      const html = ReactDOMServer.renderToString(
        React.createElement(MurmurantLogo, { variant: "white" })
      );
      expect(html).toBeDefined();
    });

    it("renders all sizes", () => {
      const sizes = ["sm", "md", "lg", "xl"] as const;
      for (const size of sizes) {
        const html = ReactDOMServer.renderToString(
          React.createElement(MurmurantLogo, { size })
        );
        expect(html).toBeDefined();
      }
    });

    it("renders all variants", () => {
      const variants = ["color", "white", "black"] as const;
      for (const variant of variants) {
        const html = ReactDOMServer.renderToString(
          React.createElement(MurmurantLogo, { variant })
        );
        expect(html).toBeDefined();
      }
    });
  });

  describe("MurmurantBug", () => {
    it("renders without crashing", () => {
      const html = ReactDOMServer.renderToString(React.createElement(MurmurantBug));
      expect(html).toBeDefined();
      expect(html.length).toBeGreaterThan(0);
    });

    it("renders as SVG", () => {
      const html = ReactDOMServer.renderToString(React.createElement(MurmurantBug));
      expect(html).toContain("<svg");
      expect(html).toContain("</svg>");
    });

    it("accepts size prop", () => {
      const html = ReactDOMServer.renderToString(
        React.createElement(MurmurantBug, { size: 32 })
      );
      expect(html).toContain('width="32"');
      expect(html).toContain('height="32"');
    });

    it("accepts variant prop", () => {
      const html = ReactDOMServer.renderToString(
        React.createElement(MurmurantBug, { variant: "white" })
      );
      expect(html).toContain("#FFFFFF");
    });

    it("has accessible label", () => {
      const html = ReactDOMServer.renderToString(React.createElement(MurmurantBug));
      expect(html).toContain('aria-label="Murmurant"');
      expect(html).toContain('role="img"');
    });

    it("renders all valid sizes", () => {
      const sizes = [16, 24, 32, 48, 64] as const;
      for (const size of sizes) {
        const html = ReactDOMServer.renderToString(
          React.createElement(MurmurantBug, { size })
        );
        expect(html).toContain(`width="${size}"`);
      }
    });
  });

  describe("MurmurantWordmark", () => {
    it("renders without crashing", () => {
      const html = ReactDOMServer.renderToString(React.createElement(MurmurantWordmark));
      expect(html).toBeDefined();
      expect(html.length).toBeGreaterThan(0);
    });

    it("renders Murmurant text", () => {
      const html = ReactDOMServer.renderToString(React.createElement(MurmurantWordmark));
      expect(html).toContain("Murmurant");
    });
  });
});
