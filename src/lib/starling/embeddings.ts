// Copyright (c) Murmurant, Inc.
// Embedding generation for Starling RAG pipeline

import type { LLMConfig } from "./llm";

/**
 * Embedding configuration
 * We use OpenAI's text-embedding-3-small for cost efficiency
 * (~$0.02 per 1M tokens vs $0.13 for ada-002)
 */
export interface EmbeddingConfig {
  provider: "openai" | "together";
  apiKey: string;
  model: string;
  dimensions: number;
}

/**
 * Get embedding configuration from environment
 */
export function getEmbeddingConfig(): EmbeddingConfig {
  // OpenAI embeddings are best quality/cost ratio
  if (process.env.OPENAI_API_KEY) {
    return {
      provider: "openai",
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
      dimensions: 1536,
    };
  }

  // Together.ai as fallback
  if (process.env.TOGETHER_API_KEY) {
    return {
      provider: "together",
      apiKey: process.env.TOGETHER_API_KEY,
      model: "togethercomputer/m2-bert-80M-8k-retrieval",
      dimensions: 768,
    };
  }

  throw new Error(
    "No embedding API key configured. Set OPENAI_API_KEY or TOGETHER_API_KEY."
  );
}

/**
 * Generate embeddings for text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const config = getEmbeddingConfig();

  switch (config.provider) {
    case "openai":
      return generateOpenAIEmbedding(text, config);
    case "together":
      return generateTogetherEmbedding(text, config);
    default:
      throw new Error(`Unknown embedding provider: ${config.provider}`);
  }
}

/**
 * Generate embeddings for multiple texts (batch)
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const config = getEmbeddingConfig();

  // OpenAI supports batch embedding
  if (config.provider === "openai") {
    return generateOpenAIEmbeddings(texts, config);
  }

  // Fallback to sequential for other providers
  return Promise.all(texts.map((text) => generateEmbedding(text)));
}

/**
 * OpenAI embedding API
 */
async function generateOpenAIEmbedding(
  text: string,
  config: EmbeddingConfig
): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI Embedding API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * OpenAI batch embedding API
 */
async function generateOpenAIEmbeddings(
  texts: string[],
  config: EmbeddingConfig
): Promise<number[][]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      input: texts,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI Embedding API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  // Sort by index to maintain order
  return data.data
    .sort((a: { index: number }, b: { index: number }) => a.index - b.index)
    .map((item: { embedding: number[] }) => item.embedding);
}

/**
 * Together.ai embedding API
 */
async function generateTogetherEmbedding(
  text: string,
  config: EmbeddingConfig
): Promise<number[]> {
  const response = await fetch("https://api.together.xyz/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Together Embedding API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Document chunk for indexing
 */
export interface DocumentChunk {
  id: string;
  content: string;
  source: string;
  sourceType: "runbook" | "faq" | "help" | "policy";
  title?: string;
  section?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Chunk text into smaller pieces for embedding
 * Uses sentence-aware chunking to avoid splitting mid-sentence
 */
export function chunkText(
  text: string,
  maxChunkSize: number = 500,
  overlap: number = 50
): string[] {
  const chunks: string[] = [];

  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    // If adding this paragraph exceeds max size, save current and start new
    if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      // Keep overlap from end of previous chunk
      const words = currentChunk.split(/\s+/);
      const overlapWords = words.slice(-Math.ceil(overlap / 5)); // ~5 chars per word
      currentChunk = overlapWords.join(" ") + " " + paragraph;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Prepare document for indexing
 */
export function prepareDocument(
  content: string,
  source: string,
  sourceType: DocumentChunk["sourceType"],
  title?: string
): DocumentChunk[] {
  const chunks = chunkText(content);

  return chunks.map((chunk, index) => ({
    id: `${source}:${index}`,
    content: chunk,
    source,
    sourceType,
    title,
    section: extractSection(chunk),
  }));
}

/**
 * Extract section header from chunk if present
 */
function extractSection(chunk: string): string | undefined {
  // Look for markdown headers
  const headerMatch = chunk.match(/^#+\s+(.+)$/m);
  if (headerMatch) {
    return headerMatch[1];
  }
  return undefined;
}
