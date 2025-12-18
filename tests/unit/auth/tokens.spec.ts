// Copyright (c) Santa Barbara Newcomers Club
// Unit tests for auth token utilities

import { describe, it, expect } from "vitest";
import {
  generateToken,
  hashToken,
  verifyToken,
  generateLoginToken,
  generateSessionToken,
} from "@/lib/auth/tokens";

describe("Auth Token Utilities", () => {
  describe("generateToken", () => {
    it("generates a base64url-encoded token", () => {
      const token = generateToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      // Base64url encoded 32 bytes = ~43 characters
      expect(token.length).toBeGreaterThanOrEqual(40);
    });

    it("generates tokens with high entropy", () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        tokens.add(generateToken());
      }
      // All tokens should be unique
      expect(tokens.size).toBe(1000);
    });

    it("generates tokens that are base64url compatible", () => {
      const token = generateToken();
      // Base64url should not contain + / =
      expect(token).not.toMatch(/[+/=]/);
      // Should only contain alphanumeric, - and _
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  describe("hashToken", () => {
    it("returns a hash in salt:hash format", () => {
      const token = generateToken();
      const hash = hashToken(token);

      expect(hash).toContain(":");
      const [salt, hashPart] = hash.split(":");
      expect(salt).toBeDefined();
      expect(hashPart).toBeDefined();
      expect(salt.length).toBeGreaterThan(0);
      expect(hashPart.length).toBeGreaterThan(0);
    });

    it("generates different hashes for the same token (due to random salt)", () => {
      const token = generateToken();
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);

      // Hashes should be different due to different random salts
      expect(hash1).not.toBe(hash2);
    });

    it("generates different hashes for different tokens", () => {
      const token1 = generateToken();
      const token2 = generateToken();
      const hash1 = hashToken(token1);
      const hash2 = hashToken(token2);

      expect(hash1).not.toBe(hash2);
    });

    it("produces consistent hash length", () => {
      const hashes: string[] = [];
      for (let i = 0; i < 10; i++) {
        hashes.push(hashToken(generateToken()));
      }

      // All hashes should have same format/length
      const lengths = hashes.map((h) => h.split(":")[1].length);
      expect(new Set(lengths).size).toBe(1);
    });
  });

  describe("verifyToken", () => {
    it("returns true for matching token and hash", () => {
      const token = generateToken();
      const hash = hashToken(token);

      expect(verifyToken(token, hash)).toBe(true);
    });

    it("returns false for non-matching token", () => {
      const token1 = generateToken();
      const token2 = generateToken();
      const hash1 = hashToken(token1);

      expect(verifyToken(token2, hash1)).toBe(false);
    });

    it("returns false for invalid hash format (no colon)", () => {
      const token = generateToken();
      expect(verifyToken(token, "invalidhash")).toBe(false);
    });

    it("returns false for empty salt", () => {
      const token = generateToken();
      expect(verifyToken(token, ":somehash")).toBe(false);
    });

    it("returns false for empty hash", () => {
      const token = generateToken();
      expect(verifyToken(token, "somesalt:")).toBe(false);
    });

    it("returns false for empty token", () => {
      const hash = hashToken(generateToken());
      expect(verifyToken("", hash)).toBe(false);
    });

    it("returns false for invalid base64url in hash", () => {
      const token = generateToken();
      // Invalid base64url characters
      expect(verifyToken(token, "!!!:@@@")).toBe(false);
    });

    it("handles malformed stored hash gracefully", () => {
      const token = generateToken();
      expect(verifyToken(token, "")).toBe(false);
      expect(verifyToken(token, "abc")).toBe(false);
      expect(verifyToken(token, "a:b:c")).toBe(false);
    });

    it("is resistant to timing attacks (constant-time comparison)", () => {
      // This is a basic sanity check - true timing attack resistance
      // requires more sophisticated testing
      const token = generateToken();
      const hash = hashToken(token);

      // Both should complete without error
      const result1 = verifyToken(token, hash);
      const result2 = verifyToken(generateToken(), hash);

      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });
  });

  describe("generateLoginToken", () => {
    it("returns both token and hash", () => {
      const { token, hash } = generateLoginToken();

      expect(token).toBeDefined();
      expect(hash).toBeDefined();
      expect(typeof token).toBe("string");
      expect(typeof hash).toBe("string");
    });

    it("returns a hash that verifies against the token", () => {
      const { token, hash } = generateLoginToken();
      expect(verifyToken(token, hash)).toBe(true);
    });

    it("generates unique tokens each call", () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateLoginToken().token);
      }
      expect(tokens.size).toBe(100);
    });
  });

  describe("generateSessionToken", () => {
    it("returns both token and hash", () => {
      const { token, hash } = generateSessionToken();

      expect(token).toBeDefined();
      expect(hash).toBeDefined();
      expect(typeof token).toBe("string");
      expect(typeof hash).toBe("string");
    });

    it("returns a hash that verifies against the token", () => {
      const { token, hash } = generateSessionToken();
      expect(verifyToken(token, hash)).toBe(true);
    });

    it("generates unique tokens each call", () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateSessionToken().token);
      }
      expect(tokens.size).toBe(100);
    });
  });

  describe("Security Properties", () => {
    it("tokens have at least 256 bits of entropy", () => {
      const token = generateToken();
      // Base64url encoded: 43 chars = 32 bytes = 256 bits
      // Decode and check byte length
      const bytes = Buffer.from(token, "base64url");
      expect(bytes.length).toBe(32);
    });

    it("salts have at least 128 bits of entropy", () => {
      const { hash } = generateLoginToken();
      const [saltBase64] = hash.split(":");
      const saltBytes = Buffer.from(saltBase64, "base64url");
      expect(saltBytes.length).toBe(16); // 128 bits
    });

    it("derived keys have 256 bits", () => {
      const { hash } = generateLoginToken();
      const [, hashBase64] = hash.split(":");
      const hashBytes = Buffer.from(hashBase64, "base64url");
      expect(hashBytes.length).toBe(32); // 256 bits
    });

    it("different tokens with same salt pattern still produce different hashes", () => {
      // This verifies that we're not accidentally reusing salts
      const results = [];
      for (let i = 0; i < 100; i++) {
        const { token, hash } = generateLoginToken();
        results.push({ token, hash });
      }

      // All hashes should be unique
      const uniqueHashes = new Set(results.map((r) => r.hash));
      expect(uniqueHashes.size).toBe(100);

      // All tokens should be unique
      const uniqueTokens = new Set(results.map((r) => r.token));
      expect(uniqueTokens.size).toBe(100);
    });
  });
});
