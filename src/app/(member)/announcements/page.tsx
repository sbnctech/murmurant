"use client";

/**
 * Announcements Page - Club news and announcements
 *
 * Displays club announcements with filtering and read tracking.
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import React, { useState } from "react";

type AnnouncementCategory = "General" | "Events" | "Governance";

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  author: string;
  publishedAt: string;
  isRead: boolean;
}

const SAMPLE_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "a1",
    title: "January Luncheon Registration Now Open",
    content:
      "We are excited to announce that registration for our January General Meeting Luncheon is now open! Join us for a wonderful afternoon of food, fellowship, and an inspiring guest speaker. The event will be held at the Fess Parker DoubleTree Resort on January 15th at 11:30 AM. Early registration is encouraged as seating is limited. We look forward to seeing you there!",
    category: "Events",
    author: "VP Activities",
    publishedAt: "Dec 27, 2024",
    isRead: false,
  },
  {
    id: "a2",
    title: "Board of Directors Election Results",
    content:
      "The results are in! We are pleased to announce the newly elected Board of Directors for 2025. Congratulations to all elected officers who will begin their terms on January 1st. A special thank you to all members who participated in the voting process and to the outgoing board members for their dedicated service. The transition meeting is scheduled for December 30th.",
    category: "Governance",
    author: "President",
    publishedAt: "Dec 20, 2024",
    isRead: false,
  },
  {
    id: "a3",
    title: "Holiday Office Hours",
    content:
      "Please note that the club office will have limited hours during the holiday season. From December 23rd through January 2nd, the office will be closed. For urgent matters, please contact the President directly via email. Regular office hours will resume on January 3rd, 2025. We wish everyone a safe and happy holiday season!",
    category: "General",
    author: "Office Manager",
    publishedAt: "Dec 18, 2024",
    isRead: true,
  },
  {
    id: "a4",
    title: "New Interest Group: Photography Club",
    content:
      "We are thrilled to announce the formation of a new interest group focused on photography! Whether you are a beginner or an experienced photographer, this group welcomes all skill levels. Monthly meetups will include photo walks, technique workshops, and image critique sessions. The inaugural meeting will be held on January 10th at 2:00 PM. Contact the group chair to sign up.",
    category: "General",
    author: "VP Membership",
    publishedAt: "Dec 15, 2024",
    isRead: false,
  },
  {
    id: "a5",
    title: "Annual Budget Approved for 2025",
    content:
      "At the December board meeting, the 2025 annual budget was unanimously approved. Key highlights include increased funding for member events, technology upgrades for our website and member portal, and continued support for our charitable giving program. The full budget document is available for member review in the governance documents section. Thank you to the Finance Committee for their thorough work.",
    category: "Governance",
    author: "Treasurer",
    publishedAt: "Dec 12, 2024",
    isRead: true,
  },
  {
    id: "a6",
    title: "Wine & Dine Group: February Italian Night",
    content:
      "Mark your calendars! The Wine & Dine interest group is hosting an Italian-themed evening on February 8th at Bella Vista Restaurant. The evening will feature a curated menu of regional Italian dishes paired with wines from Tuscany and Piedmont. Space is limited to 24 guests. Registration opens January 15th for members only.",
    category: "Events",
    author: "Wine & Dine Chair",
    publishedAt: "Dec 10, 2024",
    isRead: false,
  },
];

const CATEGORIES: AnnouncementCategory[] = ["General", "Events", "Governance"];

function getCategoryColor(category: AnnouncementCategory): string {
  switch (category) {
    case "General":
      return "#64748b";
    case "Events":
      return "#2563eb";
    case "Governance":
      return "#7c3aed";
  }
}

function AnnouncementCard({
  announcement,
  onMarkAsRead,
}: {
  announcement: Announcement;
  onMarkAsRead: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      style={{
        backgroundColor: announcement.isRead ? "#f8fafc" : "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "12px",
        borderLeft: announcement.isRead ? "4px solid #e2e8f0" : "4px solid #2563eb",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "8px",
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "4px",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                fontWeight: "600",
                color: "#ffffff",
                backgroundColor: getCategoryColor(announcement.category),
                padding: "2px 8px",
                borderRadius: "4px",
                textTransform: "uppercase",
              }}
            >
              {announcement.category}
            </span>
            {!announcement.isRead && (
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: "600",
                  color: "#2563eb",
                  backgroundColor: "#dbeafe",
                  padding: "2px 8px",
                  borderRadius: "4px",
                }}
              >
                NEW
              </span>
            )}
          </div>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "#1e293b",
              margin: "0 0 4px 0",
            }}
          >
            {announcement.title}
          </h3>
          <div style={{ fontSize: "12px", color: "#64748b" }}>
            {announcement.author} &bull; {announcement.publishedAt}
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: "14px",
          color: "#475569",
          lineHeight: "1.6",
          marginTop: "12px",
        }}
      >
        {isExpanded ? (
          announcement.content
        ) : (
          <>
            {announcement.content.slice(0, 150)}
            {announcement.content.length > 150 && "..."}
          </>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginTop: "12px",
        }}
      >
        {announcement.content.length > 150 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              backgroundColor: "transparent",
              color: "#2563eb",
              border: "none",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {isExpanded ? "Show less" : "Read more"}
          </button>
        )}
        {!announcement.isRead && (
          <button
            onClick={() => onMarkAsRead(announcement.id)}
            style={{
              backgroundColor: "transparent",
              color: "#64748b",
              border: "none",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Mark as read
          </button>
        )}
      </div>
    </div>
  );
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState(SAMPLE_ANNOUNCEMENTS);
  const [selectedCategory, setSelectedCategory] = useState<AnnouncementCategory | "All">("All");

  const handleMarkAsRead = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
    );
  };

  const handleMarkAllAsRead = () => {
    setAnnouncements((prev) => prev.map((a) => ({ ...a, isRead: true })));
  };

  const filteredAnnouncements =
    selectedCategory === "All"
      ? announcements
      : announcements.filter((a) => a.category === selectedCategory);

  const unreadCount = announcements.filter((a) => !a.isRead).length;

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: "800px",
        margin: "0 auto",
        padding: "24px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#1e293b",
              margin: "0 0 4px 0",
            }}
          >
            Announcements
          </h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            style={{
              backgroundColor: "#f1f5f9",
              color: "#475569",
              border: "none",
              borderRadius: "6px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            Mark all as read
          </button>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setSelectedCategory("All")}
          style={{
            backgroundColor: selectedCategory === "All" ? "#1e293b" : "#f1f5f9",
            color: selectedCategory === "All" ? "#ffffff" : "#475569",
            border: "none",
            borderRadius: "6px",
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              backgroundColor: selectedCategory === cat ? getCategoryColor(cat) : "#f1f5f9",
              color: selectedCategory === cat ? "#ffffff" : "#475569",
              border: "none",
              borderRadius: "6px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div>
        {filteredAnnouncements.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "48px 24px",
              color: "#64748b",
            }}
          >
            No announcements in this category
          </div>
        ) : (
          filteredAnnouncements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              onMarkAsRead={handleMarkAsRead}
            />
          ))
        )}
      </div>
    </div>
  );
}
