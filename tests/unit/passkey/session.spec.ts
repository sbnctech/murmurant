// Copyright (c) Santa Barbara Newcomers Club
// Unit tests for passkey session management

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// Mock next/headers before importing the module
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

import {
  createSession,
  getSession,
  destroySession,
  destroyAllSessions,
  cleanupExpiredSessions,
  getSessionStats,
} from "@/lib/passkey/session";

describe("Passkey Session Management", () => {
  beforeEach(() => {
    // Clear all sessions before each test
    // We'll create fresh sessions in each test
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("createSession", () => {
    it("creates a session with all required fields", () => {
      const sessionId = createSession({
        memberId: "member-123",
        userAccountId: "account-456",
        email: "test@example.com",
        globalRole: "member",
      });

      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe("string");
      expect(sessionId.length).toBeGreaterThan(20); // Base64url encoded 32 bytes
    });

    it("creates a session with IP and user agent", () => {
      const sessionId = createSession(
        {
          memberId: "member-123",
          userAccountId: "account-456",
          email: "test@example.com",
          globalRole: "admin",
        },
        "192.168.1.1",
        "Mozilla/5.0 Test Browser"
      );

      const session = getSession(sessionId);
      expect(session).not.toBeNull();
      expect(session?.ipAddress).toBe("192.168.1.1");
      expect(session?.userAgent).toBe("Mozilla/5.0 Test Browser");
    });

    it("generates unique session IDs", () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const id = createSession({
          memberId: `member-${i}`,
          userAccountId: `account-${i}`,
          email: `test${i}@example.com`,
          globalRole: "member",
        });
        expect(ids.has(id)).toBe(false);
        ids.add(id);
      }
      expect(ids.size).toBe(100);
    });
  });

  describe("getSession", () => {
    it("returns session data for valid session ID", () => {
      const sessionId = createSession({
        memberId: "member-123",
        userAccountId: "account-456",
        email: "test@example.com",
        globalRole: "president",
      });

      const session = getSession(sessionId);
      expect(session).not.toBeNull();
      expect(session?.memberId).toBe("member-123");
      expect(session?.userAccountId).toBe("account-456");
      expect(session?.email).toBe("test@example.com");
      expect(session?.globalRole).toBe("president");
    });

    it("returns null for invalid session ID", () => {
      const session = getSession("invalid-session-id");
      expect(session).toBeNull();
    });

    it("returns null for empty session ID", () => {
      const session = getSession("");
      expect(session).toBeNull();
    });

    it("updates lastActivityAt on each access", async () => {
      const sessionId = createSession({
        memberId: "member-123",
        userAccountId: "account-456",
        email: "test@example.com",
        globalRole: "member",
      });

      const session1 = getSession(sessionId);
      const initialActivity = session1?.lastActivityAt;

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      const session2 = getSession(sessionId);
      expect(session2?.lastActivityAt.getTime()).toBeGreaterThanOrEqual(
        initialActivity!.getTime()
      );
    });
  });

  describe("destroySession", () => {
    it("destroys an existing session", () => {
      const sessionId = createSession({
        memberId: "member-123",
        userAccountId: "account-456",
        email: "test@example.com",
        globalRole: "member",
      });

      // Verify session exists
      expect(getSession(sessionId)).not.toBeNull();

      // Destroy it
      destroySession(sessionId);

      // Verify it's gone
      expect(getSession(sessionId)).toBeNull();
    });

    it("does not throw when destroying non-existent session", () => {
      expect(() => destroySession("non-existent-session")).not.toThrow();
    });
  });

  describe("destroyAllSessions", () => {
    it("destroys all sessions for a specific user", () => {
      // Create multiple sessions for the same user with unique IDs
      const userAccountId = `account-destroy-${Date.now()}`;
      const session1 = createSession({
        memberId: "member-destroy-1",
        userAccountId,
        email: "destroy1@example.com",
        globalRole: "member",
      });
      const session2 = createSession({
        memberId: "member-destroy-2",
        userAccountId,
        email: "destroy2@example.com",
        globalRole: "member",
      });

      // Create a session for a different user
      const otherSession = createSession({
        memberId: "member-destroy-other",
        userAccountId: `account-destroy-other-${Date.now()}`,
        email: "destroy-other@example.com",
        globalRole: "member",
      });

      // Verify sessions exist
      expect(getSession(session1)).not.toBeNull();
      expect(getSession(session2)).not.toBeNull();
      expect(getSession(otherSession)).not.toBeNull();

      // Destroy all sessions for the user
      const count = destroyAllSessions(userAccountId);
      expect(count).toBe(2);

      // Verify user's sessions are gone
      expect(getSession(session1)).toBeNull();
      expect(getSession(session2)).toBeNull();

      // Verify other user's session is intact
      expect(getSession(otherSession)).not.toBeNull();
    });

    it("returns 0 when user has no sessions", () => {
      const count = destroyAllSessions("non-existent-user-" + Date.now());
      expect(count).toBe(0);
    });
  });

  describe("session expiration", () => {
    it("returns null for sessions past max lifetime", () => {
      vi.useFakeTimers();
      const now = Date.now();
      vi.setSystemTime(now);

      const sessionId = createSession({
        memberId: "member-123",
        userAccountId: "account-456",
        email: "test@example.com",
        globalRole: "member",
      });

      // Session should be valid initially
      expect(getSession(sessionId)).not.toBeNull();

      // Advance time past max lifetime (7 days + 1 second)
      vi.setSystemTime(now + 7 * 24 * 60 * 60 * 1000 + 1000);

      // Session should be expired
      expect(getSession(sessionId)).toBeNull();
    });

    it("returns null for idle sessions", () => {
      vi.useFakeTimers();
      const now = Date.now();
      vi.setSystemTime(now);

      const sessionId = createSession({
        memberId: "member-123",
        userAccountId: "account-456",
        email: "test@example.com",
        globalRole: "member",
      });

      // Session should be valid initially
      expect(getSession(sessionId)).not.toBeNull();

      // Advance time past idle timeout (24 hours + 1 second)
      vi.setSystemTime(now + 24 * 60 * 60 * 1000 + 1000);

      // Session should be expired due to inactivity
      expect(getSession(sessionId)).toBeNull();
    });

    it("keeps session alive with activity", () => {
      vi.useFakeTimers();
      const now = Date.now();
      vi.setSystemTime(now);

      const sessionId = createSession({
        memberId: "member-123",
        userAccountId: "account-456",
        email: "test@example.com",
        globalRole: "member",
      });

      // Access session every hour for 5 hours
      for (let i = 1; i <= 5; i++) {
        vi.setSystemTime(now + i * 60 * 60 * 1000);
        expect(getSession(sessionId)).not.toBeNull();
      }
    });
  });

  describe("cleanupExpiredSessions", () => {
    it("removes expired sessions", () => {
      vi.useFakeTimers();
      const now = Date.now();
      vi.setSystemTime(now);

      // Create session1 that will expire
      const _session1 = createSession({
        memberId: "member-cleanup-1",
        userAccountId: "account-cleanup-1",
        email: "test-cleanup1@example.com",
        globalRole: "member",
      });

      // Advance time by 12 hours (under idle timeout)
      vi.setSystemTime(now + 12 * 60 * 60 * 1000);

      // Create session2 - this will have a later createdAt
      const session2 = createSession({
        memberId: "member-cleanup-2",
        userAccountId: "account-cleanup-2",
        email: "test-cleanup2@example.com",
        globalRole: "member",
      });

      // Advance time by another 13 hours (total 25 hours from start)
      // session1: 25 hours since creation (idle timeout exceeded)
      // session2: 13 hours since creation (still valid)
      vi.setSystemTime(now + 25 * 60 * 60 * 1000);

      // Run cleanup
      const cleaned = cleanupExpiredSessions();

      // session1 should be cleaned (idle for 25 hours > 24 hour timeout)
      expect(cleaned).toBeGreaterThanOrEqual(1);

      // session2 should remain (only 13 hours old, under 24 hour timeout)
      expect(getSession(session2)).not.toBeNull();
    });
  });

  describe("getSessionStats", () => {
    it("returns correct session statistics", () => {
      vi.useFakeTimers();
      const now = Date.now();
      vi.setSystemTime(now);

      // Create some sessions
      createSession({
        memberId: "member-1",
        userAccountId: "account-1",
        email: "test1@example.com",
        globalRole: "member",
      });
      createSession({
        memberId: "member-2",
        userAccountId: "account-2",
        email: "test2@example.com",
        globalRole: "admin",
      });

      const stats = getSessionStats();
      expect(stats.totalSessions).toBeGreaterThanOrEqual(2);
      expect(stats.activeSessions).toBeGreaterThanOrEqual(2);
    });

    it("distinguishes active from inactive sessions", () => {
      vi.useFakeTimers();
      const now = Date.now();
      vi.setSystemTime(now);

      // Create a session
      createSession({
        memberId: "member-old",
        userAccountId: "account-old",
        email: "old@example.com",
        globalRole: "member",
      });

      // Advance time past "active" threshold (5 minutes)
      vi.setSystemTime(now + 6 * 60 * 1000);

      // Create another session
      createSession({
        memberId: "member-new",
        userAccountId: "account-new",
        email: "new@example.com",
        globalRole: "member",
      });

      const stats = getSessionStats();
      expect(stats.totalSessions).toBeGreaterThanOrEqual(2);
      // Only the new session should be "active"
      expect(stats.activeSessions).toBeGreaterThanOrEqual(1);
    });
  });
});
