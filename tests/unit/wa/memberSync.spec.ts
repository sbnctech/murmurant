// Copyright © 2025 Murmurant, Inc. All rights reserved.
/**
 * Tests for Member Sync (F3 - Read-Through Cache).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getMember,
  getMembers,
  refreshMember,
  invalidateMember,
  invalidateAllMembers,
  getMemberCache,
  resetMemberCache,
  getStalenessIndicator,
  getStalenessLabel,
  incrementalSync,
  startBackgroundSync,
  stopBackgroundSync,
  getSyncStatus,
  DEFAULT_MEMBER_CACHE_CONFIG,
} from "@/lib/wa/memberSync";
import type { CachedData } from "@/lib/wa/memberSync";
import type { WaContact } from "@/lib/wa/types";

// Mock the WA client
vi.mock("@/lib/wa/client", () => ({
  getWaClient: vi.fn(),
}));

// Mock audit logging
vi.mock("@/lib/wa/audit", () => ({
  logWaOperation: vi.fn(),
  auditWaRead: vi.fn(),
}));

import { getWaClient } from "@/lib/wa/client";

// Test fixtures
const mockContact: WaContact = {
  Id: 12345,
  Url: "https://api.wildapricot.org/...",
  FirstName: "John",
  LastName: "Doe",
  Organization: null,
  Email: "john@example.com",
  DisplayName: "John Doe",
  ProfileLastUpdated: new Date().toISOString(),
  MembershipLevel: {
    Id: 1,
    Url: "https://...",
    Name: "Member",
  },
  MembershipEnabled: true,
  Status: "Active",
  FieldValues: [],
  IsAccountAdministrator: false,
  TermsOfUseAccepted: true,
};

const mockContact2: WaContact = {
  ...mockContact,
  Id: 67890,
  Email: "jane@example.com",
  FirstName: "Jane",
  LastName: "Smith",
  DisplayName: "Jane Smith",
};

describe("Member Cache", () => {
  beforeEach(() => {
    vi.useRealTimers();
    resetMemberCache();
    vi.clearAllMocks();
    // Default: WA not configured
    vi.mocked(getWaClient).mockReturnValue(null);
  });

  afterEach(() => {
    stopBackgroundSync();
    vi.useRealTimers();
    resetMemberCache();
  });

  describe("Cache Configuration", () => {
    it("should have sensible defaults", () => {
      expect(DEFAULT_MEMBER_CACHE_CONFIG.ttlMs).toBe(5 * 60 * 1000); // 5 minutes
      expect(DEFAULT_MEMBER_CACHE_CONFIG.staleThresholdMs).toBe(60 * 60 * 1000); // 60 minutes
      expect(DEFAULT_MEMBER_CACHE_CONFIG.maxEntries).toBe(10000);
    });

    it("should create a cache with default config", () => {
      const cache = getMemberCache();
      const config = cache.getConfig();
      expect(config.ttlMs).toBe(DEFAULT_MEMBER_CACHE_CONFIG.ttlMs);
    });
  });

  describe("Cache Operations", () => {
    it("should store and retrieve contacts", () => {
      const cache = getMemberCache();
      cache.set(12345, mockContact);

      const entry = cache.get(12345);
      expect(entry).not.toBeNull();
      expect(entry!.data.Email).toBe("john@example.com");
    });

    it("should return null for missing entries", () => {
      const cache = getMemberCache();
      const entry = cache.get(99999);
      expect(entry).toBeNull();
    });

    it("should invalidate individual entries", () => {
      const cache = getMemberCache();
      cache.set(12345, mockContact);

      invalidateMember(12345);

      const entry = cache.get(12345);
      expect(entry).toBeNull();
    });

    it("should invalidate all entries", () => {
      const cache = getMemberCache();
      cache.set(12345, mockContact);
      cache.set(67890, mockContact2);

      invalidateAllMembers();

      expect(cache.get(12345)).toBeNull();
      expect(cache.get(67890)).toBeNull();
    });

    it("should track cache stats", () => {
      const cache = getMemberCache();
      cache.set(12345, mockContact);

      cache.get(12345); // hit
      cache.recordHit();
      cache.get(99999); // miss
      cache.recordMiss();

      const stats = cache.getStats();
      expect(stats.size).toBe(1);
      expect(stats.hitRate).toBeGreaterThan(0);
    });

    it("should enforce LRU eviction", () => {
      // Create cache with small max size
      resetMemberCache();
      const cache = getMemberCache({
        ...DEFAULT_MEMBER_CACHE_CONFIG,
        maxEntries: 2,
      });

      // Add 3 entries
      cache.set(1, { ...mockContact, Id: 1 });
      cache.set(2, { ...mockContact, Id: 2 });
      cache.set(3, { ...mockContact, Id: 3 });

      // First entry should be evicted
      expect(cache.get(1)).toBeNull();
      expect(cache.get(2)).not.toBeNull();
      expect(cache.get(3)).not.toBeNull();
    });
  });

  describe("getMember", () => {
    it("should return null when WA not configured and no cache", async () => {
      const result = await getMember(12345);
      expect(result).toBeNull();
    });

    it("should return cached data when WA not configured", async () => {
      const cache = getMemberCache();
      cache.set(12345, mockContact);

      const result = await getMember(12345);
      expect(result).not.toBeNull();
      // Valid cached data returns as wa_cached, not mm_fallback
      expect(result!.source).toBe("wa_cached");
      expect(result!.data.Email).toBe("john@example.com");
    });

    it("should return mm_fallback when cache expired and WA not configured", async () => {
      // This test needs isolated cache with very short TTL
      vi.useFakeTimers();

      resetMemberCache();
      const cache = getMemberCache({
        ...DEFAULT_MEMBER_CACHE_CONFIG,
        ttlMs: 1000, // 1s TTL
      });
      cache.set(12345, mockContact);

      // Advance time past TTL
      vi.advanceTimersByTime(2000);

      const result = await getMember(12345);
      expect(result).not.toBeNull();
      expect(result!.source).toBe("mm_fallback");
      expect(result!.stale).toBe(true);

      vi.useRealTimers();
      // Reset cache back to default for subsequent tests
      resetMemberCache();
    });

    it("should return cached data when available and not expired", async () => {
      const cache = getMemberCache();
      cache.set(12345, mockContact);

      const result = await getMember(12345);
      expect(result).not.toBeNull();
      expect(result!.data.Email).toBe("john@example.com");
    });

    it("should fetch from WA when cache miss", async () => {
      const mockClient = {
        getContact: vi.fn().mockResolvedValue(mockContact),
      };
      vi.mocked(getWaClient).mockReturnValue(mockClient as never);

      const result = await getMember(12345);

      expect(result).not.toBeNull();
      expect(result!.source).toBe("wa_live");
      expect(result!.stale).toBe(false);
      expect(mockClient.getContact).toHaveBeenCalledWith(12345);
    });

    it("should force refresh when requested", async () => {
      const cache = getMemberCache();
      cache.set(12345, mockContact);

      const updatedContact = { ...mockContact, FirstName: "Johnny" };
      const mockClient = {
        getContact: vi.fn().mockResolvedValue(updatedContact),
      };
      vi.mocked(getWaClient).mockReturnValue(mockClient as never);

      const result = await getMember(12345, { forceRefresh: true });

      expect(result!.source).toBe("wa_live");
      expect(result!.data.FirstName).toBe("Johnny");
    });

    it("should fall back to cache on WA error", async () => {
      const cache = getMemberCache();
      cache.set(12345, mockContact);

      const mockClient = {
        getContact: vi.fn().mockRejectedValue(new Error("WA unavailable")),
      };
      vi.mocked(getWaClient).mockReturnValue(mockClient as never);

      const result = await getMember(12345, { forceRefresh: true });

      expect(result!.source).toBe("mm_fallback");
      expect(result!.stale).toBe(true);
    });
  });

  describe("getMembers", () => {
    it("should fetch multiple members", async () => {
      const mockClient = {
        getContact: vi.fn()
          .mockResolvedValueOnce(mockContact)
          .mockResolvedValueOnce(mockContact2),
      };
      vi.mocked(getWaClient).mockReturnValue(mockClient as never);

      const results = await getMembers([12345, 67890]);

      expect(results.size).toBe(2);
      expect(results.get(12345)!.data.FirstName).toBe("John");
      expect(results.get(67890)!.data.FirstName).toBe("Jane");
    });

    it("should handle partial failures gracefully", async () => {
      const mockClient = {
        getContact: vi.fn()
          .mockResolvedValueOnce(mockContact)
          .mockRejectedValueOnce(new Error("Not found")),
      };
      vi.mocked(getWaClient).mockReturnValue(mockClient as never);

      const results = await getMembers([12345, 67890]);

      expect(results.size).toBe(1);
      expect(results.get(12345)).toBeDefined();
    });
  });

  describe("refreshMember", () => {
    it("should force refresh from WA", async () => {
      const cache = getMemberCache();
      cache.set(12345, mockContact);

      const updatedContact = { ...mockContact, Email: "newemail@example.com" };
      const mockClient = {
        getContact: vi.fn().mockResolvedValue(updatedContact),
      };
      vi.mocked(getWaClient).mockReturnValue(mockClient as never);

      const result = await refreshMember(12345, "user-123");

      expect(result!.source).toBe("wa_live");
      expect(result!.data.Email).toBe("newemail@example.com");
    });
  });
});

describe("Staleness Indicators", () => {
  it("should identify fresh data", () => {
    const cached: CachedData<WaContact> = {
      data: mockContact,
      cachedAt: new Date(),
      source: "wa_live",
      stale: false,
      ageSeconds: 5,
    };

    expect(getStalenessIndicator(cached)).toBe("fresh");
  });

  it("should identify cached data", () => {
    const cached: CachedData<WaContact> = {
      data: mockContact,
      cachedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      source: "wa_cached",
      stale: false,
      ageSeconds: 300,
    };

    expect(getStalenessIndicator(cached)).toBe("cached");
  });

  it("should identify stale data", () => {
    const cached: CachedData<WaContact> = {
      data: mockContact,
      cachedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      source: "wa_cached",
      stale: true,
      ageSeconds: 7200,
    };

    expect(getStalenessIndicator(cached)).toBe("stale");
  });

  it("should identify fallback data as stale", () => {
    const cached: CachedData<WaContact> = {
      data: mockContact,
      cachedAt: new Date(),
      source: "mm_fallback",
      stale: true,
      ageSeconds: 0,
    };

    expect(getStalenessIndicator(cached)).toBe("stale");
  });

  describe("getStalenessLabel", () => {
    it("should return 'Just updated' for fresh data", () => {
      const cached: CachedData<WaContact> = {
        data: mockContact,
        cachedAt: new Date(),
        source: "wa_live",
        stale: false,
        ageSeconds: 5,
      };

      expect(getStalenessLabel(cached)).toBe("Just updated");
    });

    it("should return seconds for recent cached data", () => {
      const cached: CachedData<WaContact> = {
        data: mockContact,
        cachedAt: new Date(Date.now() - 45 * 1000),
        source: "wa_cached",
        stale: false,
        ageSeconds: 45,
      };

      expect(getStalenessLabel(cached)).toBe("Updated 45s ago");
    });

    it("should return minutes for older cached data", () => {
      const cached: CachedData<WaContact> = {
        data: mockContact,
        cachedAt: new Date(Date.now() - 5 * 60 * 1000),
        source: "wa_cached",
        stale: false,
        ageSeconds: 300,
      };

      expect(getStalenessLabel(cached)).toBe("Updated 5m ago");
    });

    it("should return fallback message for mm_fallback", () => {
      const cached: CachedData<WaContact> = {
        data: mockContact,
        cachedAt: new Date(),
        source: "mm_fallback",
        stale: true,
        ageSeconds: 0,
      };

      expect(getStalenessLabel(cached)).toBe("Using cached data (WA unavailable)");
    });

    it("should return hours for very old data", () => {
      const cached: CachedData<WaContact> = {
        data: mockContact,
        cachedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        source: "wa_cached",
        stale: true,
        ageSeconds: 7200,
      };

      expect(getStalenessLabel(cached)).toBe("Updated 2h ago");
    });
  });
});

describe("Background Sync", () => {
  beforeEach(() => {
    resetMemberCache();
    vi.clearAllMocks();
    stopBackgroundSync();
  });

  afterEach(() => {
    stopBackgroundSync();
  });

  it("should report sync status", () => {
    const status = getSyncStatus();
    expect(status.lastSyncTime).toBeNull();
    expect(status.isRunning).toBe(false);
  });

  it("should run incremental sync", async () => {
    const mockClient = {
      getAllContacts: vi.fn().mockResolvedValue([mockContact, mockContact2]),
    };
    vi.mocked(getWaClient).mockReturnValue(mockClient as never);

    const result = await incrementalSync();

    expect(result.synced).toBe(2);
    expect(result.errors).toBe(0);
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it("should update lastSyncTime after sync", async () => {
    const mockClient = {
      getAllContacts: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(getWaClient).mockReturnValue(mockClient as never);

    await incrementalSync();

    const status = getSyncStatus();
    expect(status.lastSyncTime).not.toBeNull();
  });

  it("should handle sync errors gracefully", async () => {
    const mockClient = {
      getAllContacts: vi.fn().mockRejectedValue(new Error("Network error")),
    };
    vi.mocked(getWaClient).mockReturnValue(mockClient as never);

    const result = await incrementalSync();

    expect(result.errors).toBe(1);
  });

  it("should prevent concurrent syncs", async () => {
    const mockClient = {
      getAllContacts: vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return [mockContact];
      }),
    };
    vi.mocked(getWaClient).mockReturnValue(mockClient as never);

    // Start two syncs concurrently
    const sync1 = incrementalSync();
    const sync2 = incrementalSync();

    const [result1, result2] = await Promise.all([sync1, sync2]);

    // Second should short-circuit
    expect(result2.synced).toBe(0);
    expect(result1.synced).toBe(1);
  });

  it("should start and stop background polling", async () => {
    vi.useFakeTimers();

    const mockClient = {
      getAllContacts: vi.fn().mockResolvedValue([mockContact]),
    };
    vi.mocked(getWaClient).mockReturnValue(mockClient as never);

    startBackgroundSync(1000); // 1 second interval

    // Initial sync
    await vi.advanceTimersByTimeAsync(0);
    expect(mockClient.getAllContacts).toHaveBeenCalledTimes(1);

    // Wait for next interval
    await vi.advanceTimersByTimeAsync(1000);
    expect(mockClient.getAllContacts).toHaveBeenCalledTimes(2);

    stopBackgroundSync();

    // Should not call again after stopping
    await vi.advanceTimersByTimeAsync(1000);
    expect(mockClient.getAllContacts).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });
});

describe("Cache Expiration", () => {
  beforeEach(() => {
    resetMemberCache();
    vi.clearAllMocks();
  });

  it("should mark entries as expired after TTL", () => {
    const cache = getMemberCache({
      ...DEFAULT_MEMBER_CACHE_CONFIG,
      ttlMs: 1000, // 1 second TTL
    });

    cache.set(12345, mockContact);
    const entry = cache.get(12345);

    // Simulate time passing
    vi.useFakeTimers();
    vi.advanceTimersByTime(2000);

    expect(cache.isExpired(entry!)).toBe(true);

    vi.useRealTimers();
  });

  it("should mark entries as stale after threshold", () => {
    const cache = getMemberCache({
      ...DEFAULT_MEMBER_CACHE_CONFIG,
      staleThresholdMs: 1000, // 1 second stale threshold
    });

    cache.set(12345, mockContact);
    const entry = cache.get(12345);

    // Simulate time passing
    vi.useFakeTimers();
    vi.advanceTimersByTime(2000);

    expect(cache.isStale(entry!)).toBe(true);

    vi.useRealTimers();
  });
});
