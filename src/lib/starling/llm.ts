// Copyright (c) Murmurant, Inc.
// LLM integration for Starling (Groq / Together.ai)

import type { ChatMessage, PageContext } from "./types";

/**
 * LLM Provider configuration
 */
export interface LLMConfig {
  provider: "groq" | "together" | "openai";
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Get LLM configuration from environment
 */
export function getLLMConfig(): LLMConfig {
  // Try Groq first (fastest, cheapest)
  if (process.env.GROQ_API_KEY) {
    return {
      provider: "groq",
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL ?? "mixtral-8x7b-32768",
      temperature: 0.3,
      maxTokens: 1024,
    };
  }

  // Fall back to Together.ai
  if (process.env.TOGETHER_API_KEY) {
    return {
      provider: "together",
      apiKey: process.env.TOGETHER_API_KEY,
      model: process.env.TOGETHER_MODEL ?? "mistralai/Mistral-7B-Instruct-v0.2",
      temperature: 0.3,
      maxTokens: 1024,
    };
  }

  // Fall back to OpenAI (most expensive)
  if (process.env.OPENAI_API_KEY) {
    return {
      provider: "openai",
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.3,
      maxTokens: 1024,
    };
  }

  throw new Error(
    "No LLM API key configured. Set GROQ_API_KEY, TOGETHER_API_KEY, or OPENAI_API_KEY."
  );
}

/**
 * Message format for LLM APIs
 */
interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Call the configured LLM
 */
export async function callLLM(
  messages: LLMMessage[],
  config?: Partial<LLMConfig>
): Promise<string> {
  const llmConfig = { ...getLLMConfig(), ...config };

  switch (llmConfig.provider) {
    case "groq":
      return callGroq(messages, llmConfig);
    case "together":
      return callTogether(messages, llmConfig);
    case "openai":
      return callOpenAI(messages, llmConfig);
    default:
      throw new Error(`Unknown LLM provider: ${llmConfig.provider}`);
  }
}

/**
 * Call Groq API
 */
async function callGroq(
  messages: LLMMessage[],
  config: LLMConfig
): Promise<string> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content ?? "";
}

/**
 * Call Together.ai API
 */
async function callTogether(
  messages: LLMMessage[],
  config: LLMConfig
): Promise<string> {
  const response = await fetch("https://api.together.xyz/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Together API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content ?? "";
}

/**
 * Call OpenAI API
 */
async function callOpenAI(
  messages: LLMMessage[],
  config: LLMConfig
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content ?? "";
}

/**
 * Build system prompt for Starling
 */
export function buildSystemPrompt(
  context: PageContext | undefined,
  retrievedDocs: string[]
): string {
  let prompt = `You are Starling, the helpful assistant for Murmurant (a membership organization platform).

PERSONALITY:
- Professional but friendly, like a capable colleague
- Direct - answer the question first, then elaborate if needed
- Helpful - offer next steps or related actions
- Honest - if you don't know something, say so
- Never use jargon or system IDs in responses

CRITICAL RULES:
1. Answer using ONLY the context provided below
2. If the context doesn't contain the answer, say "I don't have information about that"
3. Never make up information
4. When suggesting actions, describe what you'll help with (you cannot directly modify data)
5. Keep responses concise (2-3 sentences when possible)

`;

  // Add retrieved knowledge
  if (retrievedDocs.length > 0) {
    prompt += `KNOWLEDGE BASE:
${retrievedDocs.join("\n\n")}

`;
  }

  // Add page context
  if (context) {
    prompt += `CURRENT CONTEXT:
- Page: ${context.pageTitle} (${context.page})
`;
    if (context.entity) {
      prompt += `- Viewing: ${context.entity.type} "${context.entity.name}"
`;
    }
    if (context.availableActions.length > 0) {
      prompt += `- Available actions: ${context.availableActions.map((a) => a.label).join(", ")}
`;
    }
    if (context.state) {
      prompt += `- State: ${JSON.stringify(context.state)}
`;
    }
  }

  return prompt;
}

/**
 * Parse LLM response to extract structured data
 */
export interface ParsedResponse {
  message: string;
  intent?: string;
  action?: {
    type: "navigate" | "stage" | "escalate";
    target?: string;
    data?: Record<string, unknown>;
  };
  sources?: string[];
}

export function parseResponse(response: string): ParsedResponse {
  // Try to extract JSON if present
  const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      return {
        message: parsed.message ?? response.replace(jsonMatch[0], "").trim(),
        intent: parsed.intent,
        action: parsed.action,
        sources: parsed.sources,
      };
    } catch {
      // JSON parsing failed, return plain message
    }
  }

  return { message: response.trim() };
}
