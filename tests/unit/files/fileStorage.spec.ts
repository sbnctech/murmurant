/**
 * Unit tests for File Storage Service
 *
 * Tests cover:
 * - Storage key generation
 * - Checksum calculation
 * - File validation (type and size)
 * - Filename sanitization
 * - File CRUD operations (with temp directory)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import {
  generateStorageKey,
  calculateChecksum,
  validateFile,
  sanitizeFilename,
  storeFile,
  readFile,
  deleteFile,
  fileExists,
  getFileStats,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
} from "@/lib/fileStorage";

// ---------------------------------------------------------------------------
// Storage Key Generation Tests
// ---------------------------------------------------------------------------

describe("generateStorageKey", () => {
  it("preserves file extension", () => {
    const key = generateStorageKey("document.pdf");
    expect(key.endsWith(".pdf")).toBe(true);
  });

  it("normalizes extension to lowercase", () => {
    const key = generateStorageKey("image.PNG");
    expect(key.endsWith(".png")).toBe(true);
  });

  it("includes year/month prefix", () => {
    const key = generateStorageKey("test.txt");
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    expect(key.startsWith(`${year}/${month}/`)).toBe(true);
  });

  it("generates unique keys for same filename", () => {
    const key1 = generateStorageKey("same.txt");
    const key2 = generateStorageKey("same.txt");
    expect(key1).not.toBe(key2);
  });

  it("handles files without extension", () => {
    const key = generateStorageKey("noextension");
    // Should have year/month prefix and no extension
    expect(key).toMatch(/^\d{4}\/\d{2}\/[a-f0-9-]+$/);
  });

  it("handles files with multiple dots", () => {
    const key = generateStorageKey("file.name.tar.gz");
    expect(key.endsWith(".gz")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Checksum Calculation Tests
// ---------------------------------------------------------------------------

describe("calculateChecksum", () => {
  it("returns 64-character hex string", () => {
    const data = Buffer.from("test content");
    const checksum = calculateChecksum(data);
    expect(checksum.length).toBe(64);
    expect(checksum).toMatch(/^[a-f0-9]+$/);
  });

  it("produces consistent checksum for same content", () => {
    const data = Buffer.from("consistent content");
    const checksum1 = calculateChecksum(data);
    const checksum2 = calculateChecksum(data);
    expect(checksum1).toBe(checksum2);
  });

  it("produces different checksum for different content", () => {
    const data1 = Buffer.from("content 1");
    const data2 = Buffer.from("content 2");
    expect(calculateChecksum(data1)).not.toBe(calculateChecksum(data2));
  });

  it("handles empty buffer", () => {
    const data = Buffer.from("");
    const checksum = calculateChecksum(data);
    // SHA-256 of empty string
    expect(checksum).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });

  it("handles binary data", () => {
    const data = Buffer.from([0x00, 0xff, 0x7f, 0x80]);
    const checksum = calculateChecksum(data);
    expect(checksum.length).toBe(64);
  });
});

// ---------------------------------------------------------------------------
// File Validation Tests
// ---------------------------------------------------------------------------

describe("validateFile", () => {
  describe("MIME type validation", () => {
    it("accepts PDF files", () => {
      expect(validateFile("application/pdf", 1000)).toBeNull();
    });

    it("accepts JPEG images", () => {
      expect(validateFile("image/jpeg", 1000)).toBeNull();
    });

    it("accepts PNG images", () => {
      expect(validateFile("image/png", 1000)).toBeNull();
    });

    it("accepts Word documents", () => {
      expect(validateFile("application/msword", 1000)).toBeNull();
      expect(
        validateFile(
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          1000
        )
      ).toBeNull();
    });

    it("accepts Excel spreadsheets", () => {
      expect(validateFile("application/vnd.ms-excel", 1000)).toBeNull();
      expect(
        validateFile(
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          1000
        )
      ).toBeNull();
    });

    it("accepts plain text", () => {
      expect(validateFile("text/plain", 1000)).toBeNull();
    });

    it("accepts CSV files", () => {
      expect(validateFile("text/csv", 1000)).toBeNull();
    });

    it("accepts markdown files", () => {
      expect(validateFile("text/markdown", 1000)).toBeNull();
    });

    it("rejects executable files", () => {
      const result = validateFile("application/x-executable", 1000);
      expect(result).toContain("not allowed");
    });

    it("rejects JavaScript files", () => {
      const result = validateFile("application/javascript", 1000);
      expect(result).toContain("not allowed");
    });

    it("rejects HTML files", () => {
      const result = validateFile("text/html", 1000);
      expect(result).toContain("not allowed");
    });

    it("rejects unknown MIME types", () => {
      const result = validateFile("application/unknown", 1000);
      expect(result).toContain("not allowed");
    });
  });

  describe("File size validation", () => {
    it("accepts files under limit", () => {
      expect(validateFile("application/pdf", MAX_FILE_SIZE - 1)).toBeNull();
    });

    it("accepts files at exactly the limit", () => {
      expect(validateFile("application/pdf", MAX_FILE_SIZE)).toBeNull();
    });

    it("rejects files over limit", () => {
      const result = validateFile("application/pdf", MAX_FILE_SIZE + 1);
      expect(result).toContain("too large");
    });

    it("rejects empty files", () => {
      const result = validateFile("application/pdf", 0);
      expect(result).toContain("empty");
    });
  });
});

// ---------------------------------------------------------------------------
// Filename Sanitization Tests
// ---------------------------------------------------------------------------

describe("sanitizeFilename", () => {
  it("preserves simple filenames", () => {
    expect(sanitizeFilename("document.pdf")).toBe("document.pdf");
  });

  it("preserves dots, dashes, and underscores", () => {
    expect(sanitizeFilename("my-file_v2.0.pdf")).toBe("my-file_v2.0.pdf");
  });

  it("replaces spaces with underscores", () => {
    expect(sanitizeFilename("my document.pdf")).toBe("my_document.pdf");
  });

  it("removes path traversal attempts", () => {
    expect(sanitizeFilename("../../../etc/passwd")).toBe("passwd");
    // Backslashes are sanitized as special characters on Unix
    expect(sanitizeFilename("..\\..\\windows\\system32")).toBe(".._.._windows_system32");
  });

  it("removes path components", () => {
    expect(sanitizeFilename("/absolute/path/file.txt")).toBe("file.txt");
    expect(sanitizeFilename("relative/path/file.txt")).toBe("file.txt");
  });

  it("replaces special characters", () => {
    // 7 special chars: < > : " | ? *
    expect(sanitizeFilename("file<>:\"|?*.txt")).toBe("file_______.txt");
  });

  it("handles unicode characters", () => {
    const result = sanitizeFilename("文档.pdf");
    expect(result).toBe("__.pdf");
  });

  it("truncates overly long filenames", () => {
    const longName = "a".repeat(300) + ".pdf";
    const result = sanitizeFilename(longName);
    expect(result.length).toBeLessThanOrEqual(255);
    expect(result.endsWith(".pdf")).toBe(true);
  });

  it("handles files without extension", () => {
    expect(sanitizeFilename("README")).toBe("README");
  });
});

// ---------------------------------------------------------------------------
// ALLOWED_MIME_TYPES Constant Tests
// ---------------------------------------------------------------------------

describe("ALLOWED_MIME_TYPES", () => {
  it("includes common document types", () => {
    expect(ALLOWED_MIME_TYPES.has("application/pdf")).toBe(true);
    expect(ALLOWED_MIME_TYPES.has("application/msword")).toBe(true);
    expect(ALLOWED_MIME_TYPES.has("text/plain")).toBe(true);
    expect(ALLOWED_MIME_TYPES.has("text/csv")).toBe(true);
  });

  it("includes common image types", () => {
    expect(ALLOWED_MIME_TYPES.has("image/jpeg")).toBe(true);
    expect(ALLOWED_MIME_TYPES.has("image/png")).toBe(true);
    expect(ALLOWED_MIME_TYPES.has("image/gif")).toBe(true);
    expect(ALLOWED_MIME_TYPES.has("image/webp")).toBe(true);
    expect(ALLOWED_MIME_TYPES.has("image/svg+xml")).toBe(true);
  });

  it("excludes dangerous types", () => {
    expect(ALLOWED_MIME_TYPES.has("application/x-executable")).toBe(false);
    expect(ALLOWED_MIME_TYPES.has("application/javascript")).toBe(false);
    expect(ALLOWED_MIME_TYPES.has("text/html")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// File CRUD Operations Tests (Integration with filesystem)
// ---------------------------------------------------------------------------

describe("File CRUD Operations", () => {
  let testDir: string;
  let originalEnv: string | undefined;

  beforeEach(async () => {
    // Create temp directory for tests
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), "filestorage-test-"));
    originalEnv = process.env.FILE_STORAGE_PATH;
    process.env.FILE_STORAGE_PATH = testDir;

    // Suppress console logs during tests
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(async () => {
    // Restore env
    if (originalEnv !== undefined) {
      process.env.FILE_STORAGE_PATH = originalEnv;
    } else {
      delete process.env.FILE_STORAGE_PATH;
    }

    // Cleanup temp directory
    try {
      await fs.rm(testDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }

    vi.restoreAllMocks();
  });

  describe("storeFile", () => {
    it("stores file and returns path", async () => {
      const key = "2025/01/test-file.txt";
      const data = Buffer.from("test content");

      const result = await storeFile(key, data);

      expect(result).toContain(testDir);
      expect(result).toContain(key);
    });

    it("creates subdirectories as needed", async () => {
      const key = "2025/12/nested/deep/file.txt";
      const data = Buffer.from("nested content");

      await storeFile(key, data);

      const exists = await fileExists(key);
      expect(exists).toBe(true);
    });

    it("can store binary data", async () => {
      const key = "2025/01/binary.bin";
      const data = Buffer.from([0x00, 0x01, 0xff, 0xfe]);

      await storeFile(key, data);
      const retrieved = await readFile(key);

      expect(retrieved).toEqual(data);
    });
  });

  describe("readFile", () => {
    it("reads stored file", async () => {
      const key = "2025/01/readable.txt";
      const data = Buffer.from("readable content");
      await storeFile(key, data);

      const result = await readFile(key);

      expect(result).toEqual(data);
    });

    it("returns null for non-existent file", async () => {
      const result = await readFile("non/existent/file.txt");
      expect(result).toBeNull();
    });
  });

  describe("deleteFile", () => {
    it("deletes existing file and returns true", async () => {
      const key = "2025/01/deletable.txt";
      await storeFile(key, Buffer.from("delete me"));

      const result = await deleteFile(key);

      expect(result).toBe(true);
      expect(await fileExists(key)).toBe(false);
    });

    it("returns false for non-existent file", async () => {
      const result = await deleteFile("non/existent.txt");
      expect(result).toBe(false);
    });
  });

  describe("fileExists", () => {
    it("returns true for existing file", async () => {
      const key = "2025/01/exists.txt";
      await storeFile(key, Buffer.from("I exist"));

      expect(await fileExists(key)).toBe(true);
    });

    it("returns false for non-existent file", async () => {
      expect(await fileExists("does/not/exist.txt")).toBe(false);
    });
  });

  describe("getFileStats", () => {
    it("returns size and modification time for existing file", async () => {
      const key = "2025/01/stats.txt";
      const data = Buffer.from("stats content");
      await storeFile(key, data);

      const stats = await getFileStats(key);

      expect(stats).not.toBeNull();
      expect(stats!.size).toBe(data.length);
      expect(stats!.modifiedAt).toBeInstanceOf(Date);
    });

    it("returns null for non-existent file", async () => {
      const stats = await getFileStats("non/existent.txt");
      expect(stats).toBeNull();
    });
  });

  describe("round-trip integrity", () => {
    it("data survives store/read cycle", async () => {
      const key = generateStorageKey("roundtrip.txt");
      const originalData = Buffer.from("Round trip test with special chars: éàü");

      await storeFile(key, originalData);
      const retrievedData = await readFile(key);

      expect(retrievedData).toEqual(originalData);
      expect(calculateChecksum(retrievedData!)).toBe(calculateChecksum(originalData));
    });
  });
});
