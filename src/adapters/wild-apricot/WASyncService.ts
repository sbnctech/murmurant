/**
 * Wild Apricot Sync Service
 *
 * Handles full data synchronization between Murmurant and Wild Apricot.
 * This is the main orchestrator for WA data import.
 */

import { loadWAConfig, type WAConfig } from "./config";
import { WAAuthService, getWAAuthService } from "./WAAuthService";
import { WAMemberService, getWAMemberService } from "./WAMemberService";
import type {
  SyncResult,
  SyncStats,
  SyncError,
  WAAdapterStatus,
} from "./types";

/**
 * Sync options
 */
export interface WASyncOptions {
  /** Run in dry-run mode (no database writes) */
  dryRun?: boolean;
  /** Sync only members */
  membersOnly?: boolean;
  /** Sync only events */
  eventsOnly?: boolean;
  /** Include registrations in sync */
  includeRegistrations?: boolean;
  /** Event lookback days */
  eventsLookbackDays?: number;
  /** Event lookahead days */
  eventsLookaheadDays?: number;
}

/**
 * WA Sync Service
 *
 * Orchestrates data synchronization between Murmurant and Wild Apricot.
 */
export class WASyncService {
  private config: WAConfig;
  private authService: WAAuthService;
  private memberService: WAMemberService;

  constructor(
    config?: WAConfig,
    authService?: WAAuthService,
    memberService?: WAMemberService
  ) {
    this.config = config ?? loadWAConfig();
    this.authService = authService ?? getWAAuthService();
    this.memberService = memberService ?? getWAMemberService();
  }

  /**
   * Get adapter connection status
   */
  async getStatus(): Promise<WAAdapterStatus> {
    try {
      const token = await this.authService.getToken();
      return {
        connected: true,
        lastSync: null, // TODO: Track in database
        lastError: null,
        accountId: token.accountId,
      };
    } catch (error) {
      return {
        connected: false,
        lastSync: null,
        lastError: error instanceof Error ? error.message : String(error),
        accountId: null,
      };
    }
  }

  /**
   * Run a full sync with Wild Apricot
   */
  async runSync(options: WASyncOptions = {}): Promise<SyncResult> {
    const startedAt = new Date();
    const errors: SyncError[] = [];

    const stats = {
      members: this.emptyStats(),
      events: this.emptyStats(),
      registrations: this.emptyStats(),
    };

    try {
      // Sync members
      if (!options.eventsOnly) {
        const memberResult = await this.syncMembers(options.dryRun ?? false);
        stats.members = memberResult.stats;
        errors.push(...memberResult.errors);
      }

      // Sync events (placeholder - delegate to importer)
      if (!options.membersOnly) {
        // TODO: Implement event sync
        // For now, this delegates to the existing importer
      }

      const finishedAt = new Date();

      return {
        success: errors.length === 0,
        mode: "full",
        startedAt,
        finishedAt,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        stats,
        errors,
      };
    } catch (error) {
      const finishedAt = new Date();

      errors.push({
        entityType: "Member",
        waId: 0,
        message: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        mode: "full",
        startedAt,
        finishedAt,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        stats,
        errors,
      };
    }
  }

  /**
   * Sync members from Wild Apricot
   */
  private async syncMembers(
    dryRun: boolean
  ): Promise<{ stats: SyncStats; errors: SyncError[] }> {
    const stats = this.emptyStats();
    const errors: SyncError[] = [];

    try {
      const members = await this.memberService.fetchAllMembers();

      for (const member of members) {
        try {
          if (!dryRun) {
            // TODO: Upsert to database via Prisma
            // For now, just count
          }
          stats.created++; // or updated based on existing record
        } catch (error) {
          stats.errors++;
          errors.push({
            entityType: "Member",
            waId: member.waId,
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }
    } catch (error) {
      errors.push({
        entityType: "Member",
        waId: 0,
        message: `Failed to fetch members: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    return { stats, errors };
  }

  private emptyStats(): SyncStats {
    return {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
    };
  }
}

// Singleton instance
let defaultInstance: WASyncService | null = null;

/**
 * Get the default WASyncService instance
 */
export function getWASyncService(): WASyncService {
  if (!defaultInstance) {
    defaultInstance = new WASyncService();
  }
  return defaultInstance;
}

/**
 * Reset the default instance (for testing)
 */
export function resetWASyncService(): void {
  defaultInstance = null;
}
