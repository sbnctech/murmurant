/**
 * PhotoStreamCard - Shows recent club photos
 *
 * Displays a grid of recent photos from club events.
 * Part of the "My SBNC" member home page curated column.
 *
 * Copyright © 2025 Murmurant, Inc.
 */

"use client";

import SectionCard from "@/components/layout/SectionCard";

interface Photo {
  id: string;
  src: string;
  alt: string;
  eventTitle?: string;
}

// Demo photos - placeholder images
const DEMO_PHOTOS: Photo[] = [
  {
    id: "1",
    src: "https://picsum.photos/seed/sbnc1/200/200",
    alt: "Holiday Luncheon",
    eventTitle: "Holiday Luncheon",
  },
  {
    id: "2",
    src: "https://picsum.photos/seed/sbnc2/200/200",
    alt: "Book Club Meeting",
    eventTitle: "Book Club",
  },
  {
    id: "3",
    src: "https://picsum.photos/seed/sbnc3/200/200",
    alt: "Wine Tasting",
    eventTitle: "Wine Tasting",
  },
  {
    id: "4",
    src: "https://picsum.photos/seed/sbnc4/200/200",
    alt: "Garden Tour",
    eventTitle: "Garden Tour",
  },
];

export default function PhotoStreamCard() {
  return (
    <SectionCard
      title="Recent Photos"
      testId="photo-stream-card"
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "var(--token-space-sm)",
        }}
      >
        {DEMO_PHOTOS.map((photo) => (
          <div
            key={photo.id}
            data-test-id={`photo-${photo.id}`}
            style={{
              position: "relative",
              aspectRatio: "1",
              borderRadius: "var(--token-radius-lg)",
              overflow: "hidden",
              backgroundColor: "var(--token-color-surface-2)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.src}
              alt={photo.alt}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            {photo.eventTitle && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "var(--token-space-xs)",
                  background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                  color: "#fff",
                  fontSize: "var(--token-text-sm)",
                }}
              >
                {photo.eventTitle}
              </div>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
