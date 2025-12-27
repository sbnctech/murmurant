/**
 * Unit tests for Migration Preview Report Generator
 *
 * Tests cover:
 * - Determinism (same input produces same content hash)
 * - Invariant checking
 * - Markdown formatting
 * - Error handling
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { generatePreviewReport, formatPreviewAsMarkdown } from '../../../scripts/migration/lib/preview';

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

function createTestBundle(dir: string, files: Record<string, string>): void {
  fs.mkdirSync(dir, { recursive: true });
  for (const [filename, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, filename), content);
  }
}

function cleanupTestBundle(dir: string): void {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true });
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Migration Preview Report', () => {
  let testDir: string;

  beforeAll(() => {
    testDir = path.join(os.tmpdir(), 'preview-test-' + Date.now());
  });

  afterAll(() => {
    cleanupTestBundle(testDir);
  });

  describe('generatePreviewReport', () => {
    it('should generate a report from a valid bundle', () => {
      const bundleDir = path.join(testDir, 'valid-bundle');
      createTestBundle(bundleDir, {
        'members.csv': 'Email,Display name,Status\njohn@example.com,John Doe,Active\njane@example.com,Jane Doe,Active',
        'events.csv': 'Title,Start date,Registrations\nMonthly Meeting,2024-01-15,25\nAnnual Gala,2024-03-20,100',
      });

      const report = generatePreviewReport({ bundlePath: bundleDir });

      expect(report.summary.members.total).toBe(2);
      expect(report.summary.events.total).toBe(2);
      expect(report.contentHash).toBeDefined();
      expect(report.contentHash.length).toBe(16);
    });

    it('should produce deterministic content hash for same input', () => {
      const bundleDir = path.join(testDir, 'deterministic-bundle');
      createTestBundle(bundleDir, {
        'members.csv': 'Email,Display name\ntest@test.com,Test User',
      });

      const report1 = generatePreviewReport({ bundlePath: bundleDir });
      const report2 = generatePreviewReport({ bundlePath: bundleDir });

      // Content hash should be the same (excludes generatedAt and previewId)
      expect(report1.contentHash).toBe(report2.contentHash);

      // But previewId and generatedAt should differ
      expect(report1.previewId).not.toBe(report2.previewId);
    });

    it('should detect invalid email addresses (INV-1)', () => {
      const bundleDir = path.join(testDir, 'invalid-email-bundle');
      createTestBundle(bundleDir, {
        'members.csv': 'Email,Display name\ninvalid-email,Bad User\ngood@example.com,Good User',
      });

      const report = generatePreviewReport({ bundlePath: bundleDir });

      const inv1 = report.invariants.find((i) => i.id === 'INV-1');
      expect(inv1).toBeDefined();
      expect(inv1?.status).toBe('fail');
      expect(inv1?.message).toContain('1 members have invalid emails');
    });

    it('should detect missing event titles (INV-2)', () => {
      const bundleDir = path.join(testDir, 'missing-title-bundle');
      createTestBundle(bundleDir, {
        'events.csv': 'Title,Start date\n,2024-01-15\nValid Event,2024-01-20',
      });

      const report = generatePreviewReport({ bundlePath: bundleDir });

      const inv2 = report.invariants.find((i) => i.id === 'INV-2');
      expect(inv2).toBeDefined();
      expect(inv2?.status).toBe('fail');
      expect(inv2?.message).toContain('1 events missing titles');
    });

    it('should detect duplicate emails (INV-4)', () => {
      const bundleDir = path.join(testDir, 'duplicate-email-bundle');
      createTestBundle(bundleDir, {
        'members.csv': 'Email,Display name\ndup@example.com,First\ndup@example.com,Second\nunique@example.com,Unique',
      });

      const report = generatePreviewReport({ bundlePath: bundleDir });

      const inv4 = report.invariants.find((i) => i.id === 'INV-4');
      expect(inv4).toBeDefined();
      expect(inv4?.status).toBe('warn');
      expect(inv4?.message).toContain('1 duplicate email');
    });

    it('should calculate error rate (INV-6)', () => {
      const bundleDir = path.join(testDir, 'error-rate-bundle');
      createTestBundle(bundleDir, {
        'members.csv': 'Email,Display name\ngood@test.com,Good',
        'events.csv': 'Title,Start date\nGood Event,2024-01-15',
      });

      const report = generatePreviewReport({ bundlePath: bundleDir });

      const inv6 = report.invariants.find((i) => i.id === 'INV-6');
      expect(inv6).toBeDefined();
      expect(inv6?.status).toBe('pass');
      expect(inv6?.message).toContain('0.0% error rate');
    });

    it('should extract sample members', () => {
      const bundleDir = path.join(testDir, 'sample-members-bundle');
      createTestBundle(bundleDir, {
        'members.csv': 'Email,Display name,Membership level,Status\na@test.com,Alice,Gold,Active\nb@test.com,Bob,Silver,Active\nc@test.com,Carol,Bronze,Pending',
      });

      const report = generatePreviewReport({ bundlePath: bundleDir });

      expect(report.samples.members.length).toBe(3);
      expect(report.samples.members[0].email).toBe('a@test.com');
      expect(report.samples.members[0].displayName).toBe('Alice');
      expect(report.samples.members[0].membershipLevel).toBe('Gold');
    });

    it('should throw error for non-existent bundle', () => {
      expect(() => {
        generatePreviewReport({ bundlePath: '/nonexistent/path' });
      }).toThrow('Bundle path does not exist');
    });

    it('should handle empty bundle gracefully', () => {
      const bundleDir = path.join(testDir, 'empty-bundle');
      fs.mkdirSync(bundleDir, { recursive: true });

      const report = generatePreviewReport({ bundlePath: bundleDir });

      expect(report.summary.members.total).toBe(0);
      expect(report.summary.events.total).toBe(0);
    });
  });

  describe('formatPreviewAsMarkdown', () => {
    it('should format report as markdown', () => {
      const bundleDir = path.join(testDir, 'markdown-bundle');
      createTestBundle(bundleDir, {
        'members.csv': 'Email,Display name\ntest@test.com,Test User',
        'events.csv': 'Title,Start date\nTest Event,2024-01-15',
      });

      const report = generatePreviewReport({ bundlePath: bundleDir });
      const markdown = formatPreviewAsMarkdown(report);

      expect(markdown).toContain('# Migration Preview Report');
      expect(markdown).toContain('## Summary');
      expect(markdown).toContain('## Invariant Checks');
      expect(markdown).toContain('_This preview is read-only. No database changes were made._');
    });

    it('should include summary table in markdown', () => {
      const bundleDir = path.join(testDir, 'summary-table-bundle');
      createTestBundle(bundleDir, {
        'members.csv': 'Email,Display name\na@test.com,A\nb@test.com,B',
      });

      const report = generatePreviewReport({ bundlePath: bundleDir });
      const markdown = formatPreviewAsMarkdown(report);

      expect(markdown).toContain('| Entity | Total | Valid | Errors | Warnings |');
      expect(markdown).toContain('| members | 2 |');
    });

    it('should include invariant status icons', () => {
      const bundleDir = path.join(testDir, 'status-icons-bundle');
      createTestBundle(bundleDir, {
        'members.csv': 'Email,Display name\ngood@test.com,Good',
      });

      const report = generatePreviewReport({ bundlePath: bundleDir });
      const markdown = formatPreviewAsMarkdown(report);

      // Should have check mark for passing invariants
      expect(markdown).toContain('✓');
    });

    it('should include sample tables when data exists', () => {
      const bundleDir = path.join(testDir, 'sample-tables-bundle');
      createTestBundle(bundleDir, {
        'members.csv': 'Email,Display name\ntest@test.com,Test User',
        'events.csv': 'Title,Start date\nTest Event,2024-01-15',
      });

      const report = generatePreviewReport({ bundlePath: bundleDir });
      const markdown = formatPreviewAsMarkdown(report);

      expect(markdown).toContain('## Sample Members');
      expect(markdown).toContain('## Sample Events');
      expect(markdown).toContain('| Row | Email | Display Name |');
      expect(markdown).toContain('| Row | Title | Start Date |');
    });
  });

  describe('CSV parsing edge cases', () => {
    it('should handle quoted fields with commas', () => {
      const bundleDir = path.join(testDir, 'quoted-csv-bundle');
      createTestBundle(bundleDir, {
        'members.csv': 'Email,Display name\ntest@test.com,"Doe, John"',
      });

      const report = generatePreviewReport({ bundlePath: bundleDir });

      expect(report.samples.members[0].displayName).toBe('Doe, John');
    });

    it('should handle escaped quotes', () => {
      const bundleDir = path.join(testDir, 'escaped-quotes-bundle');
      createTestBundle(bundleDir, {
        'members.csv': 'Email,Display name\ntest@test.com,"John ""Johnny"" Doe"',
      });

      const report = generatePreviewReport({ bundlePath: bundleDir });

      expect(report.samples.members[0].displayName).toBe('John "Johnny" Doe');
    });

    it('should handle alternative column names', () => {
      const bundleDir = path.join(testDir, 'alt-columns-bundle');
      createTestBundle(bundleDir, {
        'contacts.csv': 'email,First name,Level\nalt@test.com,Alt User,Premium',
      });

      const report = generatePreviewReport({ bundlePath: bundleDir });

      expect(report.summary.members.total).toBe(1);
      expect(report.samples.members[0].email).toBe('alt@test.com');
    });
  });
});
