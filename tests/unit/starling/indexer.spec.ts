// Copyright (c) Murmurant, Inc.
// Unit tests for Starling indexer module

import { describe, it, expect } from "vitest";
import { extractTextFromBlocks, formatIndexReport } from "@/lib/starling/indexer";

describe("extractTextFromBlocks", () => {
  it("should extract text from simple text node", () => {
    const content = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Hello world" }],
        },
      ],
    };

    const result = extractTextFromBlocks(content);
    expect(result).toContain("Hello world");
  });

  it("should extract text from multiple paragraphs", () => {
    const content = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "First paragraph" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Second paragraph" }],
        },
      ],
    };

    const result = extractTextFromBlocks(content);
    expect(result).toContain("First paragraph");
    expect(result).toContain("Second paragraph");
  });

  it("should extract text from nested blocks", () => {
    const content = {
      blocks: [
        {
          type: "hero",
          content: {
            title: { type: "text", text: "Welcome" },
            description: { type: "text", text: "To our site" },
          },
        },
        {
          type: "section",
          blocks: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Section content" }],
            },
          ],
        },
      ],
    };

    const result = extractTextFromBlocks(content);
    expect(result).toContain("Welcome");
    expect(result).toContain("To our site");
    expect(result).toContain("Section content");
  });

  it("should handle headings", () => {
    const content = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Main Title" }],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Subtitle" }],
        },
      ],
    };

    const result = extractTextFromBlocks(content);
    expect(result).toContain("Main Title");
    expect(result).toContain("Subtitle");
  });

  it("should handle null content", () => {
    const result = extractTextFromBlocks(null);
    expect(result).toBe("");
  });

  it("should handle undefined content", () => {
    const result = extractTextFromBlocks(undefined);
    expect(result).toBe("");
  });

  it("should handle empty object", () => {
    const result = extractTextFromBlocks({});
    expect(result).toBe("");
  });

  it("should normalize whitespace", () => {
    const content = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Text   with   extra   spaces" }],
        },
      ],
    };

    const result = extractTextFromBlocks(content);
    expect(result).toBe("Text with extra spaces");
  });

  it("should extract from real CMS-style content", () => {
    // Simulates actual CMS block content structure
    const content = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Event Registration FAQ" }],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Learn how to " },
            { type: "text", text: "register for events", marks: [{ type: "bold" }] },
            { type: "text", text: " at our club." },
          ],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Step 1: Browse events" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Step 2: Click register" }],
                },
              ],
            },
          ],
        },
      ],
    };

    const result = extractTextFromBlocks(content);
    expect(result).toContain("Event Registration FAQ");
    expect(result).toContain("register for events");
    expect(result).toContain("Step 1: Browse events");
    expect(result).toContain("Step 2: Click register");
  });
});

describe("formatIndexReport", () => {
  it("should format successful indexing report", () => {
    const results = [
      { source: "doc1.md", chunksIndexed: 3, errors: [] },
      { source: "doc2.md", chunksIndexed: 5, errors: [] },
    ];

    const report = formatIndexReport(results);

    expect(report).toContain("Files processed: 2");
    expect(report).toContain("Successful: 2");
    expect(report).toContain("With errors: 0");
    expect(report).toContain("Total chunks indexed: 8");
  });

  it("should show errors in report", () => {
    const results = [
      { source: "good.md", chunksIndexed: 3, errors: [] },
      { source: "bad.md", chunksIndexed: 1, errors: ["API timeout", "Rate limited"] },
    ];

    const report = formatIndexReport(results);

    expect(report).toContain("With errors: 1");
    expect(report).toContain("bad.md");
    expect(report).toContain("API timeout");
    expect(report).toContain("Rate limited");
  });

  it("should handle empty results", () => {
    const report = formatIndexReport([]);

    expect(report).toContain("Files processed: 0");
    expect(report).toContain("Total chunks indexed: 0");
  });
});
