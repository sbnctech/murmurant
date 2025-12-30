// Copyright © 2025 Murmurant, Inc.
// Notifications page - member notification center

"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { formatClubDate } from "@/lib/timezone";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type NotificationType = "events" | "membership" | "announcements";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  link?: string;
}

// -----------------------------------------------------------------------------
// Mock Data
// -----------------------------------------------------------------------------

const initialNotifications: Notification[] = [
  {
    id: "1",
    type: "events",
    title: "Wine Tasting Event Tomorrow",
    message:
      "Reminder: The monthly wine tasting at Santa Barbara Winery is tomorrow at 5:00 PM. Don't forget to bring a friend!",
    createdAt: "2025-01-02T10:30:00Z",
    read: false,
    link: "/events/wine-tasting-jan",
  },
  {
    id: "2",
    type: "membership",
    title: "Membership Renewal Due",
    message:
      "Your annual membership expires on January 31, 2025. Renew now to continue enjoying all member benefits.",
    createdAt: "2025-01-01T14:00:00Z",
    read: false,
    link: "/membership/renew",
  },
  {
    id: "3",
    type: "announcements",
    title: "New Board Members Elected",
    message:
      "Congratulations to our newly elected board members for 2025! See the full list and learn about their plans for the club.",
    createdAt: "2024-12-28T09:00:00Z",
    read: false,
    link: "/governance",
  },
  {
    id: "4",
    type: "events",
    title: "January Luncheon Registration Open",
    message:
      "Registration is now open for the January monthly luncheon featuring guest speaker Dr. Maria Santos.",
    createdAt: "2024-12-27T11:00:00Z",
    read: true,
    link: "/events/january-luncheon",
  },
  {
    id: "5",
    type: "membership",
    title: "Welcome to the Club!",
    message:
      "Your membership application has been approved. Welcome to Santa Barbara Newcomers Club! Start exploring events and activities.",
    createdAt: "2024-12-20T15:30:00Z",
    read: true,
    link: "/events",
  },
  {
    id: "6",
    type: "announcements",
    title: "Holiday Office Hours",
    message:
      "The club office will have limited hours from December 23 to January 2. For urgent matters, please email info@sbnewcomers.org.",
    createdAt: "2024-12-18T08:00:00Z",
    read: true,
  },
  {
    id: "7",
    type: "events",
    title: "Hiking Group Meetup",
    message:
      "Join the hiking interest group this Saturday for a scenic trail at Douglas Family Preserve. All skill levels welcome.",
    createdAt: "2024-12-15T13:00:00Z",
    read: true,
    link: "/interest-groups/hiking",
  },
  {
    id: "8",
    type: "announcements",
    title: "Newsletter Published",
    message:
      "The December issue of the Newcomers Newsletter is now available. Check out member spotlights, upcoming events, and more.",
    createdAt: "2024-12-01T10:00:00Z",
    read: true,
    link: "/documents",
  },
];

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

function getTypeIcon(type: NotificationType): React.ReactNode {
  switch (type) {
    case "events":
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      );
    case "membership":
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      );
    case "announcements":
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
          />
        </svg>
      );
  }
}

function getTypeColor(type: NotificationType): { bg: string; text: string; icon: string } {
  switch (type) {
    case "events":
      return { bg: "bg-blue-50", text: "text-blue-700", icon: "text-blue-500" };
    case "membership":
      return { bg: "bg-green-50", text: "text-green-700", icon: "text-green-500" };
    case "announcements":
      return { bg: "bg-purple-50", text: "text-purple-700", icon: "text-purple-500" };
  }
}

function getTypeLabel(type: NotificationType): string {
  switch (type) {
    case "events":
      return "Event";
    case "membership":
      return "Membership";
    case "announcements":
      return "Announcement";
  }
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  return formatClubDate(date);
}

// -----------------------------------------------------------------------------
// Filter Tabs
// -----------------------------------------------------------------------------

const filterOptions: { value: NotificationType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "events", label: "Events" },
  { value: "membership", label: "Membership" },
  { value: "announcements", label: "Announcements" },
];

// -----------------------------------------------------------------------------
// Notification Card Component
// -----------------------------------------------------------------------------

function NotificationCard({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const colors = getTypeColor(notification.type);

  return (
    <div
      className={`relative rounded-lg border p-4 transition-colors ${
        notification.read
          ? "bg-white border-gray-200"
          : "bg-blue-50 border-blue-200"
      }`}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <div className="absolute top-4 left-0 w-1 h-8 bg-blue-500 rounded-r" />
      )}

      <div className="flex gap-4">
        {/* Icon */}
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colors.bg} ${colors.icon}`}
        >
          {getTypeIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors.bg} ${colors.text}`}
                >
                  {getTypeLabel(notification.type)}
                </span>
                {!notification.read && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                    New
                  </span>
                )}
              </div>
              <h3
                className={`font-medium ${
                  notification.read ? "text-gray-700" : "text-gray-900"
                }`}
              >
                {notification.title}
              </h3>
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {formatRelativeTime(notification.createdAt)}
            </span>
          </div>

          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
            {notification.message}
          </p>

          <div className="mt-3 flex items-center gap-3">
            {notification.link && (
              <Link
                href={notification.link}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View Details →
              </Link>
            )}

            {!notification.read && (
              <button
                onClick={() => onMarkAsRead(notification.id)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Mark as read
              </button>
            )}

            <button
              onClick={() => onDelete(notification.id)}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Empty State
// -----------------------------------------------------------------------------

function EmptyState({ filter }: { filter: NotificationType | "all" }) {
  return (
    <div className="text-center py-12 px-4 bg-gray-50 rounded-lg">
      <svg
        className="w-12 h-12 mx-auto text-gray-400 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 mb-1">
        No notifications
      </h3>
      <p className="text-gray-500">
        {filter === "all"
          ? "You're all caught up! Check back later for updates."
          : `No ${filter} notifications at this time.`}
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Page Component
// -----------------------------------------------------------------------------

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [filter, setFilter] = useState<NotificationType | "all">("all");

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    const filtered =
      filter === "all"
        ? notifications
        : notifications.filter((n) => n.type === filter);

    // Sort by date (newest first)
    return [...filtered].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [notifications, filter]);

  // Unread count
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // Handlers
  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="mt-1 text-gray-600">
                {unreadCount > 0
                  ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                  : "You're all caught up!"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {filterOptions.map((option) => {
            const isActive = filter === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {/* Notifications List */}
        {filteredNotifications.length > 0 ? (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <EmptyState filter={filter} />
        )}

        {/* Notification Settings Link */}
        <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200 text-center">
          <p className="text-gray-600 mb-2">
            Want to customize which notifications you receive?
          </p>
          <Link
            href="/settings/notifications"
            className="text-blue-600 font-medium hover:text-blue-700"
          >
            Manage notification preferences →
          </Link>
        </div>
      </div>
    </main>
  );
}
