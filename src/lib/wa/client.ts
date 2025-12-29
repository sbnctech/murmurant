// Copyright © 2025 Murmurant, Inc. All rights reserved.
/**
 * Wild Apricot API Client
 *
 * A typed, secure client for WA API with:
 * - Automatic pagination handling
 * - Rate limiting and circuit breaker
 * - Retry with exponential backoff
 * - Full audit logging
 * - Input validation
 *
 * Charter: P7 (observability), P9 (fail closed), N5 (audit mutations)
 */

import { loadWaConfig, WaConfig, isWaEnabled } from "./config";
import {
  WaContact,
  WaEvent,
  WaEventRegistration,
  WaSession,
  WaTokenResponse,
  WaContactRequest,
  WaRegistrationRequest,
  WaPaginatedResponse,
} from "./types";
import {
  checkRateLimit,
  validateWaId,
  validatePayloadSize,
  sanitizeWaError,
  WaValidationError,
} from "./security";
import { auditWaAuth, auditWaRead, auditWaWrite, auditWaError } from "./audit";
import { withIsolation, ExternalDependency } from "@/lib/reliability/isolation";

// ============================================================================
// CLIENT TYPES
// ============================================================================

/**
 * Pagination options for list endpoints.
 */
export type PaginationOptions = {
  /** Maximum records per page (default: 100, max: 500) */
  limit?: number;

  /** Cursor for next page (opaque, from previous response) */
  cursor?: string;
};

/**
 * Paginated response with cursor.
 */
export type PaginatedResult<T> = {
  /** Data items */
  items: T[];

  /** Total count (if available from WA) */
  totalCount?: number;

  /** Cursor for next page (null if no more pages) */
  nextCursor: string | null;

  /** Whether there are more pages */
  hasMore: boolean;
};

/**
 * Filter options for contacts.
 */
export type ContactFilter = {
  /** Filter by membership status */
  status?: string;

  /** Filter by membership level ID */
  levelId?: number;

  /** Filter by last updated since date */
  updatedSince?: Date;

  /** Search by name or email */
  search?: string;
};

/**
 * Filter options for events.
 */
export type EventFilter = {
  /** Filter by start date (events starting on or after) */
  startDate?: Date;

  /** Filter by end date (events starting on or before) */
  endDate?: Date;

  /** Include past events (default: false) */
  includePast?: boolean;

  /** Filter by registration enabled */
  registrationEnabled?: boolean;
};

// ============================================================================
// CLIENT CLASS
// ============================================================================

/**
 * Wild Apricot API Client.
 *
 * Provides a type-safe, secure interface to WA API with:
 * - Automatic token management
 * - Rate limiting
 * - Retry logic
 * - Pagination handling
 * - Audit logging
 */
export class WaClient {
  private config: WaConfig;
  private session: WaSession | null = null;
  private tokenRefreshPromise: Promise<WaSession> | null = null;

  constructor(config?: WaConfig) {
    this.config = config || loadWaConfig();
  }

  // ==========================================================================
  // AUTHENTICATION
  // ==========================================================================

  /**
   * Get a valid access token, refreshing if necessary.
   */
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid session
    if (this.session && this.session.expiresAt > new Date()) {
      return this.session.accessToken;
    }

    // Prevent concurrent token refreshes
    if (this.tokenRefreshPromise) {
      const session = await this.tokenRefreshPromise;
      return session.accessToken;
    }

    // Refresh the token
    this.tokenRefreshPromise = this.refreshToken();
    try {
      this.session = await this.tokenRefreshPromise;
      return this.session.accessToken;
    } finally {
      this.tokenRefreshPromise = null;
    }
  }

  /**
   * Refresh the OAuth token.
   */
  private async refreshToken(): Promise<WaSession> {
    const startTime = Date.now();

    // Rate limit auth requests
    const rateCheck = checkRateLimit(String(this.config.accountId), "auth");
    if (!rateCheck.allowed) {
      throw new Error(`Rate limited: retry after ${rateCheck.retryAfterMs}ms`);
    }

    try {
      const credentials = Buffer.from(
        `APIKEY:${this.config.apiKey}`
      ).toString("base64");

      const response = await fetch(this.config.tokenUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          scope: "auto",
        }),
      });

      const durationMs = Date.now() - startTime;

      if (!response.ok) {
        auditWaAuth({
          success: false,
          durationMs,
          error: `HTTP ${response.status}`,
          orgId: String(this.config.accountId),
        });
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = (await response.json()) as WaTokenResponse;

      auditWaAuth({
        success: true,
        durationMs,
        orgId: String(this.config.accountId),
      });

      return {
        accessToken: data.access_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000 - 60000), // 1 min buffer
        refreshToken: data.refresh_token,
        accountId: this.config.accountId,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      auditWaAuth({
        success: false,
        durationMs,
        error: error instanceof Error ? error.message : "Unknown error",
        orgId: String(this.config.accountId),
      });
      throw error;
    }
  }

  // ==========================================================================
  // HTTP HELPERS
  // ==========================================================================

  /**
   * Make an authenticated request to WA API with retry logic.
   */
  private async request<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    endpoint: string,
    options?: {
      body?: unknown;
      operationType?: "read" | "write";
      entityType?: string;
      waEntityId?: number;
      userId?: string;
    }
  ): Promise<T> {
    const operationType = options?.operationType || "read";

    // Rate limiting
    const rateCheck = checkRateLimit(String(this.config.accountId), operationType);
    if (!rateCheck.allowed) {
      throw new Error(`Rate limited: retry after ${rateCheck.retryAfterMs}ms`);
    }

    // Validate payload size for writes
    if (options?.body) {
      validatePayloadSize(options.body);
    }

    const startTime = Date.now();
    let lastError: Error | null = null;

    // Retry loop
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const token = await this.getAccessToken();
        const url = `${this.config.apiUrl}/accounts/${this.config.accountId}${endpoint}`;

        // Use isolation wrapper for observability
        const result = await withIsolation(
          ExternalDependency.WILD_APRICOT,
          async () => {
            const response = await fetch(url, {
              method,
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: options?.body ? JSON.stringify(options.body) : undefined,
            });

            const durationMs = Date.now() - startTime;

            if (!response.ok) {
              const errorText = await response.text();
              auditWaError({
                operationType: operationType === "read" ? "READ" : "WRITE",
                method,
                endpoint,
                entityType: options?.entityType,
                waEntityId: options?.waEntityId,
                userId: options?.userId,
                orgId: String(this.config.accountId),
                durationMs,
                responseStatus: response.status,
                error: errorText,
              });
              throw new Error(`WA API error: ${response.status} ${errorText}`);
            }

            const data = await response.json();

            // Audit successful operation
            if (method === "GET") {
              auditWaRead({
                endpoint,
                entityType: options?.entityType,
                waEntityId: options?.waEntityId,
                userId: options?.userId,
                orgId: String(this.config.accountId),
                durationMs,
              });
            } else {
              auditWaWrite({
                method,
                endpoint,
                entityType: options?.entityType,
                waEntityId: options?.waEntityId,
                userId: options?.userId,
                orgId: String(this.config.accountId),
                durationMs,
                responseStatus: response.status,
                success: true,
              });
            }

            return data as T;
          },
          { timeoutMs: this.config.timeoutMs }
        );

        if (result.success) {
          return result.data!;
        } else {
          throw result.error || new Error("Unknown error");
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry validation errors
        if (error instanceof WaValidationError) {
          throw error;
        }

        // Don't retry 4xx errors (except 429)
        if (
          lastError.message.includes("4") &&
          !lastError.message.includes("429")
        ) {
          throw lastError;
        }

        // Exponential backoff for retries
        if (attempt < this.config.maxRetries) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt), 30000);
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }
    }

    // All retries exhausted
    const sanitized = sanitizeWaError(lastError!);
    throw new Error(`${sanitized.code}: ${sanitized.message}`);
  }

  // ==========================================================================
  // PAGINATION HELPERS
  // ==========================================================================

  /**
   * Decode cursor to offset.
   */
  private decodeCursor(cursor: string | undefined): number {
    if (!cursor) return 0;
    try {
      const decoded = Buffer.from(cursor, "base64").toString("utf8");
      const offset = parseInt(decoded.split(":")[1], 10);
      return isNaN(offset) ? 0 : offset;
    } catch {
      return 0;
    }
  }

  /**
   * Encode offset to cursor.
   */
  private encodeCursor(offset: number): string {
    return Buffer.from(`wa:${offset}`).toString("base64");
  }

  /**
   * Fetch all pages of a paginated endpoint.
   */
  private async fetchAllPages<T>(
    endpoint: string,
    responseKey: "Contacts" | "Events" | "EventRegistrations",
    entityType: string,
    filter?: string
  ): Promise<T[]> {
    const all: T[] = [];
    const pageSize = 500; // Max allowed by WA
    let skip = 0;

    while (true) {
      const params = new URLSearchParams({
        $top: String(pageSize),
        $skip: String(skip),
      });
      if (filter) {
        params.set("$filter", filter);
      }

      const response = await this.request<WaPaginatedResponse<T>>(
        "GET",
        `${endpoint}?${params.toString()}`,
        { entityType }
      );

      const items = response[responseKey] || [];
      all.push(...(items as T[]));

      // Check if we got fewer than requested (last page)
      if (items.length < pageSize) {
        break;
      }

      skip += pageSize;

      // Safety limit to prevent infinite loops
      if (skip > 50000) {
        console.warn(`[WA] Pagination safety limit reached for ${endpoint}`);
        break;
      }
    }

    return all;
  }

  // ==========================================================================
  // CONTACTS API
  // ==========================================================================

  /**
   * Get contacts with pagination.
   */
  async getContacts(
    options?: PaginationOptions & ContactFilter
  ): Promise<PaginatedResult<WaContact>> {
    const limit = Math.min(options?.limit || 100, 500);
    const skip = this.decodeCursor(options?.cursor);

    // Build filter
    const filters: string[] = [];
    if (options?.status) {
      filters.push(`Status eq '${options.status}'`);
    }
    if (options?.levelId) {
      filters.push(`MembershipLevel.Id eq ${options.levelId}`);
    }
    if (options?.updatedSince) {
      filters.push(
        `'Profile last updated' gt ${options.updatedSince.toISOString()}`
      );
    }

    const params = new URLSearchParams({
      $top: String(limit),
      $skip: String(skip),
    });
    if (filters.length > 0) {
      params.set("$filter", filters.join(" AND "));
    }

    const response = await this.request<WaPaginatedResponse<WaContact>>(
      "GET",
      `/contacts?${params.toString()}`,
      { entityType: "contact" }
    );

    const items = response.Contacts || [];
    const hasMore = items.length === limit;

    return {
      items,
      totalCount: response.Count,
      nextCursor: hasMore ? this.encodeCursor(skip + limit) : null,
      hasMore,
    };
  }

  /**
   * Get ALL contacts (handles pagination automatically).
   * Use with caution for large member bases.
   */
  async getAllContacts(filter?: ContactFilter): Promise<WaContact[]> {
    const filters: string[] = [];
    if (filter?.status) {
      filters.push(`Status eq '${filter.status}'`);
    }
    if (filter?.levelId) {
      filters.push(`MembershipLevel.Id eq ${filter.levelId}`);
    }
    if (filter?.updatedSince) {
      filters.push(
        `'Profile last updated' gt ${filter.updatedSince.toISOString()}`
      );
    }

    return this.fetchAllPages<WaContact>(
      "/contacts",
      "Contacts",
      "contact",
      filters.length > 0 ? filters.join(" AND ") : undefined
    );
  }

  /**
   * Get a single contact by ID.
   */
  async getContact(waContactId: number): Promise<WaContact> {
    validateWaId(waContactId, "waContactId");
    return this.request<WaContact>("GET", `/contacts/${waContactId}`, {
      entityType: "contact",
      waEntityId: waContactId,
    });
  }

  /**
   * Create a new contact.
   */
  async createContact(
    data: WaContactRequest,
    userId?: string
  ): Promise<WaContact> {
    return this.request<WaContact>("POST", "/contacts", {
      body: data,
      operationType: "write",
      entityType: "contact",
      userId,
    });
  }

  /**
   * Update an existing contact.
   */
  async updateContact(
    waContactId: number,
    data: WaContactRequest,
    userId?: string
  ): Promise<WaContact> {
    validateWaId(waContactId, "waContactId");
    return this.request<WaContact>("PUT", `/contacts/${waContactId}`, {
      body: { ...data, Id: waContactId },
      operationType: "write",
      entityType: "contact",
      waEntityId: waContactId,
      userId,
    });
  }

  // ==========================================================================
  // EVENTS API
  // ==========================================================================

  /**
   * Get events with pagination.
   */
  async getEvents(
    options?: PaginationOptions & EventFilter
  ): Promise<PaginatedResult<WaEvent>> {
    const limit = Math.min(options?.limit || 100, 500);
    const skip = this.decodeCursor(options?.cursor);

    const params = new URLSearchParams({
      $top: String(limit),
      $skip: String(skip),
    });

    // Default to future events only
    if (!options?.includePast) {
      const now = new Date().toISOString();
      params.set("$filter", `StartDate ge ${now}`);
    }

    if (options?.startDate) {
      params.set("$filter", `StartDate ge ${options.startDate.toISOString()}`);
    }

    const response = await this.request<WaPaginatedResponse<WaEvent>>(
      "GET",
      `/events?${params.toString()}`,
      { entityType: "event" }
    );

    const items = response.Events || [];
    const hasMore = items.length === limit;

    return {
      items,
      totalCount: response.Count,
      nextCursor: hasMore ? this.encodeCursor(skip + limit) : null,
      hasMore,
    };
  }

  /**
   * Get ALL events (handles pagination automatically).
   */
  async getAllEvents(filter?: EventFilter): Promise<WaEvent[]> {
    const filters: string[] = [];
    if (!filter?.includePast) {
      filters.push(`StartDate ge ${new Date().toISOString()}`);
    }
    if (filter?.startDate) {
      filters.push(`StartDate ge ${filter.startDate.toISOString()}`);
    }
    if (filter?.endDate) {
      filters.push(`StartDate le ${filter.endDate.toISOString()}`);
    }

    return this.fetchAllPages<WaEvent>(
      "/events",
      "Events",
      "event",
      filters.length > 0 ? filters.join(" AND ") : undefined
    );
  }

  /**
   * Get a single event by ID.
   */
  async getEvent(waEventId: number): Promise<WaEvent> {
    validateWaId(waEventId, "waEventId");
    return this.request<WaEvent>("GET", `/events/${waEventId}`, {
      entityType: "event",
      waEntityId: waEventId,
    });
  }

  // ==========================================================================
  // REGISTRATIONS API
  // ==========================================================================

  /**
   * Get registrations for an event.
   */
  async getEventRegistrations(
    waEventId: number,
    options?: PaginationOptions
  ): Promise<PaginatedResult<WaEventRegistration>> {
    validateWaId(waEventId, "waEventId");

    const limit = Math.min(options?.limit || 100, 500);
    const skip = this.decodeCursor(options?.cursor);

    const params = new URLSearchParams({
      $top: String(limit),
      $skip: String(skip),
      eventId: String(waEventId),
    });

    const response = await this.request<WaPaginatedResponse<WaEventRegistration>>(
      "GET",
      `/eventregistrations?${params.toString()}`,
      { entityType: "registration", waEntityId: waEventId }
    );

    const items = response.EventRegistrations || [];
    const hasMore = items.length === limit;

    return {
      items,
      totalCount: response.Count,
      nextCursor: hasMore ? this.encodeCursor(skip + limit) : null,
      hasMore,
    };
  }

  /**
   * Create a new event registration.
   */
  async createRegistration(
    data: WaRegistrationRequest,
    userId?: string
  ): Promise<WaEventRegistration> {
    validateWaId(data.Event.Id, "eventId");
    validateWaId(data.Contact.Id, "contactId");

    return this.request<WaEventRegistration>("POST", "/eventregistrations", {
      body: data,
      operationType: "write",
      entityType: "registration",
      userId,
    });
  }

  /**
   * Cancel a registration.
   */
  async cancelRegistration(
    waRegistrationId: number,
    userId?: string
  ): Promise<void> {
    validateWaId(waRegistrationId, "waRegistrationId");

    await this.request<void>("DELETE", `/eventregistrations/${waRegistrationId}`, {
      operationType: "write",
      entityType: "registration",
      waEntityId: waRegistrationId,
      userId,
    });
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let clientInstance: WaClient | null = null;

/**
 * Get the singleton WA client instance.
 *
 * Returns null if WA is not configured.
 */
export function getWaClient(): WaClient | null {
  if (!isWaEnabled()) {
    return null;
  }

  if (!clientInstance) {
    clientInstance = new WaClient();
  }

  return clientInstance;
}

/**
 * Reset the client instance (for testing).
 */
export function resetWaClient(): void {
  clientInstance = null;
}
