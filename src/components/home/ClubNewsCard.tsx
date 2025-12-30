/**
 * ClubNewsCard - Shows recent club announcements
 *
 * Displays club news and announcements from:
 * - Published pages (news, announcements)
 * - Activity group announcements
 * - Upcoming events
 *
 * Content is filtered by RBAC based on the user's role and membership.
 * Members can customize their feed via preferences.
 *
 * Part of the "My SBNC" member home page curated column.
 *
 * Data Source: Currently uses static demo data.
 * To swap to real data later:
 *   1. Create /api/v1/news endpoint
 *   2. Replace CLUB_NEWS with fetch() in useEffect
 *   3. Keep NewsItem interface the same
 *
 * Copyright © 2025 Murmurant, Inc.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import SectionCard from "@/components/layout/SectionCard";
import { useNewsPreferences, buildNewsQueryString } from "@/hooks";
import { formatClubMonthYear } from "@/lib/timezone";

interface NewsItem {
  id: string;
  source: "page" | "announcement" | "event" | "photo";
  sourceId: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  publishedAt: string;
  expiresAt: string | null;
  href: string | null;
  isPinned: boolean;
  groupName: string | null;
  imageUrl: string | null;
  photoCount: number | null;
}

interface NewsResponse {
  items: NewsItem[];
  meta: {
    total: number;
    returned: number;
    sources: string[];
    categories: string[] | null;
  };
}

/**
 * Format date for display
 */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return formatClubMonthYear(date);
  }
}

/**
 * Get category display label
 */
function getCategoryLabel(item: NewsItem): string {
  if (item.groupName) {
    return item.groupName;
  }
  if (item.source === "event") {
    return "Upcoming Event";
  }
  if (item.source === "photo") {
    return "New Photos";
  }
  if (item.category) {
    // Capitalize first letter of each word
    return item.category
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  return item.source === "page" ? "Article" : "Announcement";
}

export default function ClubNewsCard() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { preferences, isLoading: prefsLoading } = useNewsPreferences();

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryString = buildNewsQueryString(preferences);
      const response = await fetch(`/api/v1/news${queryString}`);

      if (!response.ok) {
        throw new Error("Failed to fetch news");
      }

      const data: NewsResponse = await response.json();
      setNews(data.items);
    } catch (err) {
      console.error("Error fetching news:", err);
      setError("Unable to load news");
    } finally {
      setLoading(false);
    }
  }, [preferences]);

  // Fetch news when preferences are loaded
  useEffect(() => {
    if (!prefsLoading) {
      fetchNews();
    }
  }, [prefsLoading, fetchNews]);

  // Render loading state
  if (loading || prefsLoading) {
    return (
      <SectionCard title="News" testId="club-news-card">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--token-space-sm)",
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                padding: "var(--token-space-sm) 0",
                borderBottom:
                  i < 3 ? "1px solid var(--token-color-border)" : "none",
              }}
            >
              <div
                style={{
                  height: "12px",
                  width: "60px",
                  backgroundColor: "var(--token-color-bg-secondary)",
                  borderRadius: "4px",
                  marginBottom: "6px",
                }}
              />
              <div
                style={{
                  height: "16px",
                  width: "80%",
                  backgroundColor: "var(--token-color-bg-secondary)",
                  borderRadius: "4px",
                  marginBottom: "6px",
                }}
              />
              <div
                style={{
                  height: "32px",
                  width: "100%",
                  backgroundColor: "var(--token-color-bg-secondary)",
                  borderRadius: "4px",
                }}
              />
            </div>
          ))}
        </div>
      </SectionCard>
    );
  }

  // Render error state
  if (error) {
    return (
      <SectionCard title="News" testId="club-news-card">
        <p
          style={{
            color: "var(--token-color-text-muted)",
            fontStyle: "italic",
          }}
        >
          {error}
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="News" testId="club-news-card">
      {news.length === 0 ? (
        <p
          style={{
            color: "var(--token-color-text-muted)",
            fontStyle: "italic",
          }}
        >
          No news at this time.
        </p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--token-space-sm)",
          }}
        >
          {news.map((item, index) => {
            const isLast = index === news.length - 1;
            const content = (
              <article
                key={item.id}
                data-test-id={`news-item-${item.id}`}
                style={{
                  paddingBottom: isLast ? 0 : "var(--token-space-sm)",
                  borderBottom: isLast
                    ? "none"
                    : "1px solid var(--token-color-border)",
                }}
              >
                {/* Category + Date row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--token-space-sm)",
                    marginBottom: "2px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      textTransform: "uppercase",
                      color: item.isPinned
                        ? "var(--token-color-success)"
                        : "var(--token-color-primary)",
                      fontWeight: 600,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {item.isPinned ? "📌 " : ""}
                    {getCategoryLabel(item)}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--token-color-text-muted)",
                    }}
                  >
                    {formatDate(item.publishedAt)}
                  </span>
                </div>

                {/* Title */}
                <h3
                  style={{
                    fontSize: "var(--token-text-sm)",
                    fontWeight: 600,
                    color: "var(--token-color-text)",
                    marginTop: 0,
                    marginBottom: "2px",
                    lineHeight: 1.3,
                  }}
                >
                  {item.title}
                </h3>

                {/* Photo thumbnail (for photo items) */}
                {item.source === "photo" && item.imageUrl && (
                  <div
                    style={{
                      width: "100%",
                      height: "80px",
                      borderRadius: "6px",
                      overflow: "hidden",
                      marginTop: "4px",
                      marginBottom: "4px",
                      position: "relative",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    {item.photoCount && item.photoCount > 1 && (
                      <span
                        style={{
                          position: "absolute",
                          bottom: "4px",
                          right: "4px",
                          backgroundColor: "rgba(0,0,0,0.7)",
                          color: "white",
                          fontSize: "11px",
                          padding: "2px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        +{item.photoCount - 1} more
                      </span>
                    )}
                  </div>
                )}

                {/* Excerpt - compact */}
                {item.excerpt && item.source !== "photo" && (
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--token-color-text-muted)",
                      margin: 0,
                      lineHeight: 1.4,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {item.excerpt}
                  </p>
                )}
              </article>
            );

            // Wrap in link if href provided
            if (item.href) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  {content}
                </Link>
              );
            }
            return content;
          })}
        </div>
      )}
    </SectionCard>
  );
}
