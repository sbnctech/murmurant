/**
 * ClubNewsCard - Shows recent club announcements
 *
 * Displays club news and announcements.
 * Part of the "My SBNC" member home page curated column.
 *
 * Data Source: Currently uses static demo data.
 * To swap to real data later:
 *   1. Create /api/v1/news endpoint
 *   2. Replace CLUB_NEWS with fetch() in useEffect
 *   3. Keep NewsItem interface the same
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

"use client";

import Link from "next/link";
import SectionCard from "@/components/layout/SectionCard";

interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category?: string;
  href?: string; // Link to full article (optional)
}

/**
 * Club News Data
 *
 * Static news items for demo. Replace with API call when ready.
 * Items should be ordered newest first.
 */
const CLUB_NEWS: NewsItem[] = [
  {
    id: "news-1",
    title: "Welcome to Murmurant!",
    excerpt: "We're excited to launch our new member portal. Explore events, connect with members, and manage your profile all in one place.",
    date: "Dec 2024",
    category: "Announcement",
  },
  {
    id: "news-2",
    title: "Spring Activity Schedule",
    excerpt: "Registration opens soon for our spring lineup including hiking, wine tasting, and the annual luncheon.",
    date: "Dec 2024",
    category: "Activities",
  },
  {
    id: "news-3",
    title: "Volunteer Opportunities",
    excerpt: "Looking to get more involved? We're seeking hosts for small group activities and committee members.",
    date: "Dec 2024",
    category: "Volunteer",
  },
];

export default function ClubNewsCard() {
  return (
    <SectionCard
      title="News"
      testId="club-news-card"
    >
      {CLUB_NEWS.length === 0 ? (
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
          {CLUB_NEWS.map((item, index) => {
            const isLast = index === CLUB_NEWS.length - 1;
            const content = (
              <article
                key={item.id}
                data-test-id={`news-item-${item.id}`}
                style={{
                  paddingBottom: isLast ? 0 : "var(--token-space-sm)",
                  borderBottom: isLast ? "none" : "1px solid var(--token-color-border)",
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
                  {item.category && (
                    <span
                      style={{
                        fontSize: "11px",
                        textTransform: "uppercase",
                        color: "var(--token-color-primary)",
                        fontWeight: 600,
                        letterSpacing: "0.02em",
                      }}
                    >
                      {item.category}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--token-color-text-muted)",
                    }}
                  >
                    {item.date}
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

                {/* Excerpt - compact */}
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
