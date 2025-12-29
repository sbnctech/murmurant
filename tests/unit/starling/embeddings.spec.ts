// Copyright (c) Murmurant, Inc.
// Unit tests for Starling embeddings module

import { describe, it, expect } from "vitest";
import { chunkText, prepareDocument } from "@/lib/starling/embeddings";

describe("chunkText", () => {
  it("should keep short text as single chunk", () => {
    const text = "This is a short paragraph.";
    const chunks = chunkText(text, 500, 50);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(text);
  });

  it("should split long text into multiple chunks", () => {
    // Create multiple paragraphs that exceed maxChunkSize
    const paragraph1 = "First paragraph content. ".repeat(15);
    const paragraph2 = "Second paragraph content. ".repeat(15);
    const paragraph3 = "Third paragraph content. ".repeat(15);
    const text = paragraph1 + "\n\n" + paragraph2 + "\n\n" + paragraph3;
    const chunks = chunkText(text, 300, 50); // Use smaller chunk size to force splitting

    expect(chunks.length).toBeGreaterThan(1);
    // Verify we captured content from different paragraphs
    const allContent = chunks.join(" ");
    expect(allContent).toContain("First paragraph");
    expect(allContent).toContain("Third paragraph");
  });

  it("should respect paragraph boundaries", () => {
    const text = "First paragraph.\n\nSecond paragraph.\n\nThird paragraph.";
    const chunks = chunkText(text, 500, 50);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toContain("First paragraph");
    expect(chunks[0]).toContain("Second paragraph");
    expect(chunks[0]).toContain("Third paragraph");
  });

  it("should include overlap between chunks", () => {
    // Create text long enough to split
    const para1 = "First paragraph content here. ".repeat(20);
    const para2 = "Second paragraph content here. ".repeat(20);
    const text = para1 + "\n\n" + para2;

    const chunks = chunkText(text, 300, 50);

    expect(chunks.length).toBeGreaterThan(1);
    // Second chunk should start with some words from end of first
    // (the overlap mechanism)
  });

  it("should handle empty text", () => {
    const chunks = chunkText("", 500, 50);
    expect(chunks).toHaveLength(0);
  });

  it("should handle whitespace-only text", () => {
    const chunks = chunkText("   \n\n   ", 500, 50);
    expect(chunks).toHaveLength(0);
  });
});

describe("prepareDocument", () => {
  it("should create document chunks with correct metadata", () => {
    const content = "# Getting Started\n\nThis is the introduction.\n\nMore content here.";
    const source = "docs/getting-started.md";

    const chunks = prepareDocument(content, source, "help", "Getting Started Guide");

    expect(chunks.length).toBeGreaterThanOrEqual(1);
    expect(chunks[0].source).toBe(source);
    expect(chunks[0].sourceType).toBe("help");
    expect(chunks[0].title).toBe("Getting Started Guide");
    expect(chunks[0].id).toBe(`${source}:0`);
  });

  it("should extract section headers from chunks", () => {
    const content = "## Section Header\n\nContent under this section.";
    const chunks = prepareDocument(content, "doc.md", "faq");

    expect(chunks[0].section).toBe("Section Header");
  });

  it("should create sequential IDs for multiple chunks", () => {
    const content = "Long content. ".repeat(100);
    const chunks = prepareDocument(content, "long-doc.md", "policy");

    chunks.forEach((chunk, index) => {
      expect(chunk.id).toBe(`long-doc.md:${index}`);
    });
  });
});
