/**
 * News Widget Configuration
 *
 * Operator-level configuration for the news feed widget.
 * Controls default sources, categories, and display limits.
 *
 * Charter: P4 (no hidden rules - config is explicit and documented)
 *
 * Copyright (c) Murmurant, Inc.
 */

/**
 * News source types available in the feed
 */
export type NewsSource = "pages" | "announcements" | "events";

/**
 * News widget operator configuration
 *
 * Operators can customize these defaults via environment variables:
 * - CLUBOS_NEWS_SOURCES: Comma-separated sources (default: all)
 * - CLUBOS_NEWS_LIMIT: Max items to show (default: 10)
 * - CLUBOS_NEWS_INCLUDE_EXPIRED: Show expired items (default: false)
 */
export interface NewsConfig {
  /** Default sources to include */
  defaultSources: NewsSource[];
  /** Maximum items to display */
  defaultLimit: number;
  /** Whether to include expired announcements */
  includeExpired: boolean;
  /** Categories to highlight (empty = all) */
  highlightCategories: string[];
  /** Refresh interval in milliseconds (0 = no auto-refresh) */
  refreshInterval: number;
}

/**
 * Get operator news configuration
 */
export function getNewsConfig(): NewsConfig {
  // Parse sources from env (default: all)
  const sourcesEnv = process.env.CLUBOS_NEWS_SOURCES;
  const defaultSources: NewsSource[] = sourcesEnv
    ? (sourcesEnv.split(",").map((s) => s.trim().toLowerCase()) as NewsSource[])
    : ["pages", "announcements", "events"];

  // Parse limit (default: 10, max: 50)
  const limitEnv = process.env.CLUBOS_NEWS_LIMIT;
  const defaultLimit = limitEnv
    ? Math.min(50, Math.max(1, parseInt(limitEnv, 10) || 10))
    : 10;

  // Parse include expired (default: false)
  const expiredEnv = process.env.CLUBOS_NEWS_INCLUDE_EXPIRED;
  const includeExpired = expiredEnv === "true" || expiredEnv === "1";

  // Parse highlight categories (optional)
  const categoriesEnv = process.env.CLUBOS_NEWS_HIGHLIGHT_CATEGORIES;
  const highlightCategories = categoriesEnv
    ? categoriesEnv.split(",").map((c) => c.trim().toLowerCase())
    : [];

  // Refresh interval (default: 5 minutes)
  const refreshEnv = process.env.CLUBOS_NEWS_REFRESH_INTERVAL;
  const refreshInterval = refreshEnv ? parseInt(refreshEnv, 10) || 300000 : 300000;

  return {
    defaultSources,
    defaultLimit,
    includeExpired,
    highlightCategories,
    refreshInterval,
  };
}

/**
 * Client-safe config (subset that can be exposed to browser)
 */
export interface ClientNewsConfig {
  defaultSources: NewsSource[];
  defaultLimit: number;
  refreshInterval: number;
}

/**
 * Get client-safe news configuration
 * Used by API endpoint to send config to browser
 */
export function getClientNewsConfig(): ClientNewsConfig {
  const config = getNewsConfig();
  return {
    defaultSources: config.defaultSources,
    defaultLimit: config.defaultLimit,
    refreshInterval: config.refreshInterval,
  };
}
