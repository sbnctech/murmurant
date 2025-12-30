// Copyright © 2025 Murmurant, Inc.
// Newsletter archive page - browse past club newsletters

"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { formatClubMonthYear } from "@/lib/timezone";

interface Newsletter {
  id: string;
  title: string;
  date: string;
  preview: string;
  pdfUrl: string;
}

// Mock newsletter data
const newsletters: Newsletter[] = [
  {
    id: "nl-2024-12",
    title: "December 2024 Newsletter",
    date: "2024-12-01",
    preview: "Holiday Gala tickets now available! Plus: New member spotlight, upcoming wine tasting events, and a recap of our Thanksgiving potluck. Don't miss the President's message about our record membership growth this year.",
    pdfUrl: "/newsletters/2024-12.pdf",
  },
  {
    id: "nl-2024-11",
    title: "November 2024 Newsletter",
    date: "2024-11-01",
    preview: "Thanksgiving potluck details inside! This month features our annual fall hiking schedule, book club selections, and an interview with our Membership Chair about the welcome brunch program.",
    pdfUrl: "/newsletters/2024-11.pdf",
  },
  {
    id: "nl-2024-10",
    title: "October 2024 Newsletter",
    date: "2024-10-01",
    preview: "Fall is here! Check out our lineup of autumn activities including wine tasting, hiking adventures, and our popular book club. Also featuring volunteer opportunities and committee updates.",
    pdfUrl: "/newsletters/2024-10.pdf",
  },
  {
    id: "nl-2024-09",
    title: "September 2024 Newsletter",
    date: "2024-09-01",
    preview: "Welcome back from summer! New season, new events. Get ready for our September calendar packed with social gatherings, interest group meetups, and the return of our monthly luncheons.",
    pdfUrl: "/newsletters/2024-09.pdf",
  },
  {
    id: "nl-2024-08",
    title: "August 2024 Newsletter",
    date: "2024-08-01",
    preview: "Summer fun continues! Beach picnic recap, upcoming garden tours, and a preview of fall programming. Plus: Member travel stories and our quarterly financial update.",
    pdfUrl: "/newsletters/2024-08.pdf",
  },
  {
    id: "nl-2024-07",
    title: "July 2024 Newsletter",
    date: "2024-07-01",
    preview: "Independence Day celebration photos inside! Summer social calendar, beach activities, and a special feature on our club's history celebrating 50 years in Santa Barbara.",
    pdfUrl: "/newsletters/2024-07.pdf",
  },
  {
    id: "nl-2024-06",
    title: "June 2024 Newsletter",
    date: "2024-06-01",
    preview: "Annual Meeting recap and new board introductions. Summer event preview, volunteer appreciation, and highlights from our spring garden tour.",
    pdfUrl: "/newsletters/2024-06.pdf",
  },
  {
    id: "nl-2023-12",
    title: "December 2023 Newsletter",
    date: "2023-12-01",
    preview: "Holiday Gala 2023 was a tremendous success! Recap and photos inside. Plus: Year in review, thank you to our volunteers, and a preview of 2024 programming.",
    pdfUrl: "/newsletters/2023-12.pdf",
  },
  {
    id: "nl-2023-11",
    title: "November 2023 Newsletter",
    date: "2023-11-01",
    preview: "Thanksgiving traditions and gratitude. This month: Holiday party planning, fall hiking photos, and interest group updates. Member spotlight on our wonderful volunteers.",
    pdfUrl: "/newsletters/2023-11.pdf",
  },
  {
    id: "nl-2023-10",
    title: "October 2023 Newsletter",
    date: "2023-10-01",
    preview: "Autumn adventures await! Wine country day trip details, Halloween social planning, and a special feature on making the most of your membership.",
    pdfUrl: "/newsletters/2023-10.pdf",
  },
];

function formatNewsletterDate(dateString: string): string {
  const date = new Date(dateString);
  return formatClubMonthYear(date);
}

interface NewsletterCardProps {
  newsletter: Newsletter;
}

function NewsletterCard({ newsletter }: NewsletterCardProps) {
  const handleDownload = () => {
    alert(`Downloading: ${newsletter.title}`);
  };

  return (
    <div
      data-test-id={`newsletter-${newsletter.id}`}
      style={{
        backgroundColor: "white",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        padding: "20px",
        marginBottom: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "12px",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#1f2937",
              margin: "0 0 4px 0",
            }}
          >
            {newsletter.title}
          </h3>
          <div style={{ fontSize: "14px", color: "#6b7280" }}>
            {formatNewsletterDate(newsletter.date)}
          </div>
        </div>
      </div>

      <p
        style={{
          fontSize: "14px",
          color: "#4b5563",
          lineHeight: "1.6",
          margin: "0 0 16px 0",
        }}
      >
        {newsletter.preview}
      </p>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <Link
          href={`/newsletters/${newsletter.id}`}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: 500,
            color: "white",
            backgroundColor: "#2563eb",
            borderRadius: "6px",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Read Full Newsletter
        </Link>
        <button
          type="button"
          onClick={handleDownload}
          data-test-id={`download-${newsletter.id}`}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: 500,
            color: "#374151",
            backgroundColor: "white",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>📄</span> Download PDF
        </button>
      </div>
    </div>
  );
}

export default function NewsletterArchivePage() {
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [isSubscribed, setIsSubscribed] = useState(true);

  const availableYears = useMemo(() => {
    const years = new Set(newsletters.map((n) => new Date(n.date).getFullYear().toString()));
    return ["all", ...Array.from(years).sort((a, b) => Number(b) - Number(a))];
  }, []);

  const filteredNewsletters = useMemo(() => {
    if (selectedYear === "all") return newsletters;
    return newsletters.filter((n) => {
      const year = new Date(n.date).getFullYear().toString();
      return year === selectedYear;
    });
  }, [selectedYear]);

  const handleSubscriptionToggle = () => {
    setIsSubscribed(!isSubscribed);
  };

  return (
    <div data-test-id="newsletter-archive-page" style={{ maxWidth: "800px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 700,
              marginBottom: "8px",
              color: "#1f2937",
            }}
          >
            Newsletter Archive
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "#6b7280",
              margin: 0,
            }}
          >
            Browse past editions of the club newsletter
          </p>
        </div>

        {/* Subscription Toggle */}
        <div
          style={{
            backgroundColor: isSubscribed ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${isSubscribed ? "#bbf7d0" : "#fecaca"}`,
            borderRadius: "8px",
            padding: "12px 16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: isSubscribed ? "#166534" : "#991b1b",
                }}
              >
                {isSubscribed ? "Subscribed" : "Unsubscribed"}
              </div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                Email newsletter
              </div>
            </div>
            <button
              type="button"
              onClick={handleSubscriptionToggle}
              data-test-id="subscription-toggle"
              role="switch"
              aria-checked={isSubscribed}
              style={{
                width: "44px",
                height: "24px",
                borderRadius: "12px",
                backgroundColor: isSubscribed ? "#22c55e" : "#d1d5db",
                border: "none",
                cursor: "pointer",
                position: "relative",
                transition: "background-color 0.2s",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: "2px",
                  left: isSubscribed ? "22px" : "2px",
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  backgroundColor: "white",
                  transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Year Filter */}
      <div style={{ marginBottom: "24px" }}>
        <label
          htmlFor="year-filter"
          style={{
            display: "block",
            fontSize: "14px",
            fontWeight: 500,
            color: "#374151",
            marginBottom: "6px",
          }}
        >
          Filter by Year
        </label>
        <select
          id="year-filter"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          data-test-id="newsletter-year-filter"
          style={{
            padding: "8px 12px",
            fontSize: "14px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            backgroundColor: "white",
            minWidth: "140px",
            cursor: "pointer",
          }}
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year === "all" ? "All Years" : year}
            </option>
          ))}
        </select>
      </div>

      {/* Results Count */}
      <div
        style={{
          fontSize: "14px",
          color: "#6b7280",
          marginBottom: "16px",
        }}
      >
        Showing {filteredNewsletters.length} newsletter{filteredNewsletters.length !== 1 ? "s" : ""}
      </div>

      {/* Newsletter List */}
      {filteredNewsletters.length > 0 ? (
        <div>
          {filteredNewsletters.map((newsletter) => (
            <NewsletterCard key={newsletter.id} newsletter={newsletter} />
          ))}
        </div>
      ) : (
        <div
          data-test-id="newsletter-empty-state"
          style={{
            textAlign: "center",
            padding: "48px 24px",
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
            color: "#6b7280",
          }}
        >
          <p style={{ fontSize: "18px", marginBottom: "8px" }}>
            No newsletters found
          </p>
          <p style={{ fontSize: "14px" }}>
            Try selecting a different year
          </p>
        </div>
      )}

      {/* Information Box */}
      <div
        style={{
          marginTop: "32px",
          padding: "16px",
          backgroundColor: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: "8px",
        }}
      >
        <h4
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "#1e40af",
            margin: "0 0 8px 0",
          }}
        >
          About Our Newsletter
        </h4>
        <p
          style={{
            fontSize: "14px",
            color: "#1e3a8a",
            margin: 0,
            lineHeight: "1.5",
          }}
        >
          The club newsletter is published monthly and includes upcoming events,
          member spotlights, committee updates, and club news. Subscribers receive
          it via email at the beginning of each month.
        </p>
      </div>
    </div>
  );
}
