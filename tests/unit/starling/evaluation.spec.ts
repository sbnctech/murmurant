// Copyright (c) Murmurant, Inc.
// Evaluation tests for Starling answer quality
//
// These tests use "golden examples" to validate that Starling's
// RAG pipeline returns relevant information for known questions.
//
// Note: These tests require a seeded knowledge base and may be skipped
// in CI if the database is not available.

import { describe, it, expect, beforeAll } from "vitest";

/**
 * Golden example for testing
 * Each example has a question and expected content that should appear in the answer
 */
interface GoldenExample {
  category: string;
  question: string;
  expectedTopics: string[]; // Keywords that should appear in retrieved context
  shouldMatch: boolean; // Whether we expect relevant results
}

/**
 * Golden examples for platform-level (Murmurant) knowledge
 */
const PLATFORM_GOLDEN_EXAMPLES: GoldenExample[] = [
  {
    category: "events",
    question: "How do I register for an event?",
    expectedTopics: ["register", "event", "sign up", "RSVP"],
    shouldMatch: true,
  },
  {
    category: "events",
    question: "Can I cancel my event registration?",
    expectedTopics: ["cancel", "registration", "refund", "unregister"],
    shouldMatch: true,
  },
  {
    category: "membership",
    question: "How do I renew my membership?",
    expectedTopics: ["renew", "membership", "dues", "payment"],
    shouldMatch: true,
  },
  {
    category: "membership",
    question: "What are the membership benefits?",
    expectedTopics: ["benefit", "member", "access", "discount"],
    shouldMatch: true,
  },
  {
    category: "profile",
    question: "How do I update my email address?",
    expectedTopics: ["email", "update", "profile", "change"],
    shouldMatch: true,
  },
  {
    category: "profile",
    question: "How do I add a profile photo?",
    expectedTopics: ["photo", "profile", "picture", "avatar"],
    shouldMatch: true,
  },
  {
    category: "negative",
    question: "What's the weather like today?",
    expectedTopics: [],
    shouldMatch: false, // Should NOT find relevant docs
  },
];

/**
 * Golden examples for operator-level (specific club) knowledge
 * These would be specific to each club's policies
 */
const OPERATOR_GOLDEN_EXAMPLES: GoldenExample[] = [
  {
    category: "policies",
    question: "What is the guest policy?",
    expectedTopics: ["guest", "visitor", "bring", "policy"],
    shouldMatch: true,
  },
  {
    category: "policies",
    question: "Are there dress code requirements?",
    expectedTopics: ["dress", "code", "attire", "appropriate"],
    shouldMatch: true,
  },
  {
    category: "fees",
    question: "What are the membership fees?",
    expectedTopics: ["fee", "cost", "dues", "price", "annual"],
    shouldMatch: true,
  },
];

describe("Starling Evaluation", () => {
  // These tests are skipped unless STARLING_EVAL=true
  // They require a seeded database with knowledge
  const shouldRun = process.env.STARLING_EVAL === "true";

  describe.skipIf(!shouldRun)("RAG Retrieval Quality", () => {
    beforeAll(async () => {
      // Verify database connection and knowledge exists
      // This would check that the knowledge base is populated
    });

    describe("Platform Knowledge", () => {
      PLATFORM_GOLDEN_EXAMPLES.forEach((example) => {
        it(`should ${example.shouldMatch ? "find" : "not find"} relevant content for: "${example.question}"`, async () => {
          // Import RAG search function
          const { searchKnowledge } = await import("@/lib/starling/rag");

          const results = await searchKnowledge(example.question, {
            limit: 5,
            minSimilarity: 0.5,
          });

          if (example.shouldMatch) {
            expect(results.length).toBeGreaterThan(0);

            // Check that at least one expected topic appears in results
            const allContent = results.map((r) => r.content.toLowerCase()).join(" ");
            const foundTopics = example.expectedTopics.filter((topic) =>
              allContent.includes(topic.toLowerCase())
            );

            expect(
              foundTopics.length,
              `Expected to find at least one of: ${example.expectedTopics.join(", ")}`
            ).toBeGreaterThan(0);
          } else {
            // For negative examples, results should be empty or low relevance
            if (results.length > 0) {
              // If there are results, they should have low similarity
              expect(results[0].similarity).toBeLessThan(0.7);
            }
          }
        });
      });
    });

    describe("Operator Knowledge", () => {
      OPERATOR_GOLDEN_EXAMPLES.forEach((example) => {
        it(`should find relevant operator content for: "${example.question}"`, async () => {
          const { searchKnowledge } = await import("@/lib/starling/rag");

          // Search with a test organization ID
          const results = await searchKnowledge(example.question, {
            limit: 5,
            minSimilarity: 0.5,
            organizationId: process.env.TEST_ORG_ID,
          });

          if (example.shouldMatch) {
            expect(results.length).toBeGreaterThan(0);

            const allContent = results.map((r) => r.content.toLowerCase()).join(" ");
            const foundTopics = example.expectedTopics.filter((topic) =>
              allContent.includes(topic.toLowerCase())
            );

            expect(
              foundTopics.length,
              `Expected to find at least one of: ${example.expectedTopics.join(", ")}`
            ).toBeGreaterThan(0);
          }
        });
      });
    });
  });

  describe("Retrieval Metrics", () => {
    it.skipIf(!shouldRun)("should calculate precision and recall for test set", async () => {
      const { searchKnowledge } = await import("@/lib/starling/rag");

      let totalRelevant = 0;
      let totalRetrieved = 0;
      let totalRelevantRetrieved = 0;

      for (const example of PLATFORM_GOLDEN_EXAMPLES.filter((e) => e.shouldMatch)) {
        const results = await searchKnowledge(example.question, {
          limit: 5,
          minSimilarity: 0.5,
        });

        const allContent = results.map((r) => r.content.toLowerCase()).join(" ");
        const foundTopics = example.expectedTopics.filter((topic) =>
          allContent.includes(topic.toLowerCase())
        );

        totalRelevant += example.expectedTopics.length;
        totalRetrieved += results.length;
        totalRelevantRetrieved += foundTopics.length;
      }

      const precision = totalRelevantRetrieved / totalRetrieved || 0;
      const recall = totalRelevantRetrieved / totalRelevant || 0;

      console.log(`Precision: ${(precision * 100).toFixed(1)}%`);
      console.log(`Recall: ${(recall * 100).toFixed(1)}%`);

      // We expect decent precision and recall (adjustable thresholds)
      expect(precision).toBeGreaterThan(0.3);
      expect(recall).toBeGreaterThan(0.3);
    });
  });
});

describe("Intent + RAG Integration", () => {
  const shouldRun = process.env.STARLING_EVAL === "true";

  it.skipIf(!shouldRun)("should answer event questions correctly", async () => {
    const { detectIntent } = await import("@/lib/starling/intents");
    const { searchKnowledge } = await import("@/lib/starling/rag");

    const question = "What events are coming up this month?";

    // First detect intent
    const intent = detectIntent(question);
    expect(intent?.intent).toBe("event:list");

    // For general questions, also search knowledge base
    const docs = await searchKnowledge(question, { limit: 3 });

    // Intent detection should work even without docs
    expect(intent).not.toBeNull();
  });

  it.skipIf(!shouldRun)("should combine intent and knowledge for registration questions", async () => {
    const { detectIntent } = await import("@/lib/starling/intents");
    const { searchKnowledge } = await import("@/lib/starling/rag");

    const question = "How do I register for the Holiday Party?";

    // Detect intent
    const intent = detectIntent(question);
    expect(intent?.intent).toBe("event:register");
    expect(intent?.entities.eventName).toContain("Holiday Party");

    // Also get relevant knowledge for how registration works
    const docs = await searchKnowledge("how to register for events", { limit: 3 });

    // In a real scenario, we'd combine intent execution with knowledge context
  });
});
