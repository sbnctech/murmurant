/**
 * Wild Apricot API Client
 *
 * TypeScript port of proven Python patterns from wa-dev.
 * Implements OAuth authentication, pagination, async polling, and retry logic.
 */

import {
  WAConfig,
  loadWAConfig,
} from "./config";
import {
  WATokenResponse,
  WAContact,
  WAContactField,
  WAEvent,
  WAEventRegistration,
  WAMembershipLevel,
  WAPaginatedResponse,
  WAAsyncQueryResponse,
  WAAsyncQueryResult,
  WAApiException,
  WAAsyncQueryException,
  WATokenException,
} from "./types";

// ============================================================================
// Token Cache
// ============================================================================

interface CachedToken {
  accessToken: string;
  expiresAt: number; // Unix timestamp in ms
}

let tokenCache: CachedToken | null = null;

// ============================================================================
// Wild Apricot Client
// ============================================================================

export class WildApricotClient {
  private config: WAConfig;

  constructor(config?: WAConfig) {
    this.config = config ?? loadWAConfig();
  }

  // --------------------------------------------------------------------------
  // Authentication
  // --------------------------------------------------------------------------

  /**
   * Get a valid access token, refreshing if necessary.
   */
  async getAccessToken(): Promise<string> {
    // Check if cached token is still valid
    if (tokenCache) {
      const now = Date.now();
      if (tokenCache.expiresAt > now + this.config.tokenExpiryBufferMs) {
        return tokenCache.accessToken;
      }
    }

    // Fetch new token
    const token = await this.fetchAccessToken();
    return token;
  }

  /**
   * Fetch a new access token from WA OAuth endpoint.
   */
  private async fetchAccessToken(): Promise<string> {
    const credentials = Buffer.from(`APIKEY:${this.config.apiKey}`).toString("base64");

    const response = await fetch(this.config.authUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials&scope=auto",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new WATokenException(
        `Failed to obtain access token: ${response.status} ${text}`
      );
    }

    const data: WATokenResponse = await response.json();

    // Cache the token
    tokenCache = {
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };

    return data.access_token;
  }

  /**
   * Clear the token cache (useful for testing).
   */
  clearTokenCache(): void {
    tokenCache = null;
  }

  // --------------------------------------------------------------------------
  // HTTP Request Handling
  // --------------------------------------------------------------------------

  /**
   * Make an authenticated API request with retry logic.
   */
  async request<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    endpoint: string,
    options: {
      params?: Record<string, string | number>;
      body?: unknown;
      retryCount?: number;
    } = {}
  ): Promise<T> {
    const { params, body, retryCount = 0 } = options;

    // Build URL with query parameters
    const url = new URL(`${this.config.apiBaseUrl}${endpoint}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, String(value));
      }
    }

    // Get access token
    const token = await this.getAccessToken();

    // Build request options
    const fetchOptions: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(this.config.requestTimeoutMs),
    };

    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url.toString(), fetchOptions);

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get("Retry-After") || "60", 10);
        if (retryCount < this.config.maxRetries) {
          console.warn(`[WA] Rate limited, waiting ${retryAfter}s before retry...`);
          await this.sleep(retryAfter * 1000);
          return this.request<T>(method, endpoint, { ...options, retryCount: retryCount + 1 });
        }
        throw new WAApiException("Rate limit exceeded after retries", 429, "RATE_LIMITED");
      }

      // Handle auth errors (token may have been revoked)
      if (response.status === 401) {
        this.clearTokenCache();
        if (retryCount < 1) {
          console.warn("[WA] Token rejected, refreshing and retrying...");
          return this.request<T>(method, endpoint, { ...options, retryCount: retryCount + 1 });
        }
        throw new WAApiException("Authentication failed", 401, "AUTH_FAILED");
      }

      // Handle server errors with retry
      if (response.status >= 500 && retryCount < this.config.maxRetries) {
        const delay = this.calculateBackoff(retryCount);
        console.warn(`[WA] Server error ${response.status}, retrying in ${delay}ms...`);
        await this.sleep(delay);
        return this.request<T>(method, endpoint, { ...options, retryCount: retryCount + 1 });
      }

      // Handle other errors
      if (!response.ok) {
        const text = await response.text();
        throw new WAApiException(
          `API request failed: ${response.status}`,
          response.status,
          "API_ERROR",
          text
        );
      }

      // Parse response
      const data = await response.json();
      return data as T;
    } catch (error) {
      // Handle timeout errors with retry
      if (error instanceof Error && error.name === "TimeoutError") {
        if (retryCount < this.config.maxRetries) {
          const delay = this.calculateBackoff(retryCount);
          console.warn(`[WA] Request timeout, retrying in ${delay}ms...`);
          await this.sleep(delay);
          return this.request<T>(method, endpoint, { ...options, retryCount: retryCount + 1 });
        }
        throw new WAApiException("Request timeout after retries", 408, "TIMEOUT");
      }
      throw error;
    }
  }

  /**
   * Calculate exponential backoff delay.
   */
  private calculateBackoff(retryCount: number): number {
    const delay = this.config.retryBaseDelayMs * Math.pow(2, retryCount);
    const jitter = Math.random() * 1000; // Add up to 1s jitter
    return Math.min(delay + jitter, this.config.retryMaxDelayMs);
  }

  /**
   * Sleep for a specified duration.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // --------------------------------------------------------------------------
  // Pagination
  // --------------------------------------------------------------------------

  /**
   * Fetch all pages of a paginated endpoint.
   */
  async fetchPaginated<T>(
    endpoint: string,
    options: {
      params?: Record<string, string | number>;
      itemsKey?: string;
    } = {}
  ): Promise<T[]> {
    const { params = {}, itemsKey } = options;
    const allItems: T[] = [];
    let skip = 0;

    while (true) {
      const response = await this.request<WAPaginatedResponse<T>>("GET", endpoint, {
        params: {
          ...params,
          $top: this.config.pageSize,
          $skip: skip,
        },
      });

      // Extract items from response (WA uses different keys for different endpoints)
      const items =
        (itemsKey ? (response as Record<string, T[]>)[itemsKey] : null) ||
        response.Items ||
        response.Contacts ||
        response.Events ||
        response.Invoices ||
        [];

      if (items.length === 0) {
        break;
      }

      allItems.push(...items);

      // Check if we got a full page (more data may exist)
      if (items.length < this.config.pageSize) {
        break;
      }

      skip += this.config.pageSize;
    }

    return allItems;
  }

  // --------------------------------------------------------------------------
  // Async Query Polling
  // --------------------------------------------------------------------------

  /**
   * Poll an async query result until complete.
   * Used for large contact queries that WA processes asynchronously.
   */
  async pollAsyncResult<T>(resultUrl: string): Promise<T[]> {
    for (let attempt = 0; attempt < this.config.asyncMaxAttempts; attempt++) {
      await this.sleep(this.config.asyncPollIntervalMs);

      const token = await this.getAccessToken();
      const response = await fetch(resultUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(this.config.requestTimeoutMs),
      });

      if (!response.ok) {
        throw new WAApiException(
          `Async poll failed: ${response.status}`,
          response.status,
          "ASYNC_POLL_ERROR"
        );
      }

      const result: WAAsyncQueryResult<T> = await response.json();

      switch (result.State) {
        case "Complete":
          return result.Contacts || result.Items || [];

        case "Failed":
          throw new WAAsyncQueryException(
            "Async query failed",
            result.ErrorDetails
          );

        case "Queued":
        case "Processing":
          // Continue polling
          break;
      }
    }

    throw new WAAsyncQueryException(
      `Async query timed out after ${this.config.asyncMaxAttempts} attempts`
    );
  }

  // --------------------------------------------------------------------------
  // Entity Fetchers
  // --------------------------------------------------------------------------

  /**
   * Fetch all contacts (members).
   * Uses async query for large result sets.
   */
  async fetchContacts(filter?: string): Promise<WAContact[]> {
    const endpoint = `/accounts/${this.config.accountId}/contacts`;

    // Build filter parameter
    const params: Record<string, string | number> = {
      $async: "true", // Request async processing for large result sets
    };

    if (filter) {
      params.$filter = filter;
    }

    // Initial request returns a result URL for async queries
    const response = await this.request<WAAsyncQueryResponse | WAPaginatedResponse<WAContact>>(
      "GET",
      endpoint,
      { params }
    );

    // Check if this is an async response
    if ("ResultUrl" in response && response.ResultUrl) {
      console.log("[WA] Contacts query is async, polling for results...");
      return this.pollAsyncResult<WAContact>(response.ResultUrl);
    }

    // Direct response (small result set) - cast to paginated response
    const paginatedResponse = response as WAPaginatedResponse<WAContact>;
    return paginatedResponse.Contacts || paginatedResponse.Items || [];
  }

  /**
   * Fetch contacts modified since a given date.
   */
  async fetchContactsModifiedSince(since: Date): Promise<WAContact[]> {
    const isoDate = since.toISOString();
    const filter = `'Profile last updated' gt ${isoDate}`;
    return this.fetchContacts(filter);
  }

  /**
   * Fetch all events.
   */
  async fetchEvents(filter?: string): Promise<WAEvent[]> {
    const endpoint = `/accounts/${this.config.accountId}/events`;

    const params: Record<string, string | number> = {};
    if (filter) {
      params.$filter = filter;
    }

    return this.fetchPaginated<WAEvent>(endpoint, { params, itemsKey: "Events" });
  }

  /**
   * Fetch events starting on or after a given date.
   */
  async fetchEventsFromDate(fromDate: Date): Promise<WAEvent[]> {
    const isoDate = fromDate.toISOString().split("T")[0]; // YYYY-MM-DD
    const filter = `StartDate ge ${isoDate}`;
    return this.fetchEvents(filter);
  }

  /**
   * Fetch event details (includes organizer and registration types).
   */
  async fetchEventDetails(eventId: number): Promise<WAEvent> {
    const endpoint = `/accounts/${this.config.accountId}/events/${eventId}`;
    return this.request<WAEvent>("GET", endpoint);
  }

  /**
   * Fetch registrations for a specific event.
   */
  async fetchEventRegistrations(eventId: number): Promise<WAEventRegistration[]> {
    const endpoint = `/accounts/${this.config.accountId}/eventregistrations`;

    return this.fetchPaginated<WAEventRegistration>(endpoint, {
      params: { eventId },
    });
  }

  /**
   * Fetch all membership levels.
   */
  async fetchMembershipLevels(): Promise<WAMembershipLevel[]> {
    const endpoint = `/accounts/${this.config.accountId}/membershiplevels`;

    return this.fetchPaginated<WAMembershipLevel>(endpoint);
  }

  /**
   * Fetch all contact field definitions.
   * Returns the schema of all fields available in contact profiles.
   */
  async fetchContactFields(): Promise<WAContactField[]> {
    const endpoint = `/accounts/${this.config.accountId}/contactfields`;

    // ContactFields API returns a direct array, not paginated
    return this.request<WAContactField[]>("GET", endpoint);
  }

  // --------------------------------------------------------------------------
  // Health Check
  // --------------------------------------------------------------------------

  /**
   * Verify API connectivity and credentials.
   */
  async healthCheck(): Promise<{ ok: boolean; accountId: string; error?: string }> {
    try {
      // Verify we can get a token
      await this.getAccessToken();

      // Verify account access
      const _levels = await this.fetchMembershipLevels();

      return {
        ok: true,
        accountId: this.config.accountId,
      };
    } catch (error) {
      return {
        ok: false,
        accountId: this.config.accountId,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a WA client with default configuration.
 */
export function createWAClient(): WildApricotClient {
  return new WildApricotClient();
}

/**
 * Create a WA client with custom configuration (for testing).
 */
export function createWAClientWithConfig(config: WAConfig): WildApricotClient {
  return new WildApricotClient(config);
}
