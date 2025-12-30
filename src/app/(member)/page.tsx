// Copyright © 2025 Murmurant, Inc.
// Member dashboard home page

import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession } from "@/lib/passkey";
import { prisma } from "@/lib/prisma";
import { formatClubDateShort, formatClubTime } from "@/lib/timezone";

export const metadata = {
  title: "My Club | Santa Barbara Newcomers Club",
  description: "Your member dashboard - events, announcements, and quick links",
};

// Mock announcements until announcements feature is built
const MOCK_ANNOUNCEMENTS = [
  {
    id: "1",
    title: "Holiday Party Registration Now Open",
    excerpt: "Join us for our annual holiday celebration on December 15th. Space is limited!",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  {
    id: "2",
    title: "New Hiking Group Starting",
    excerpt: "We're launching a beginner-friendly hiking group. First hike is January 8th.",
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
  },
  {
    id: "3",
    title: "Board Meeting Minutes Posted",
    excerpt: "November board meeting minutes are now available in the members area.",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
  },
];

export default async function MemberDashboardPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login?returnTo=/");
  }

  // Fetch member data with committees
  const member = await prisma.member.findUnique({
    where: { id: session.memberId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      joinedAt: true,
      membershipStatus: {
        select: { isEligibleForRenewal: true },
      },
      membershipTier: {
        select: { name: true },
      },
      roleAssignments: {
        where: { endDate: null },
        select: {
          committee: {
            select: { id: true, name: true },
          },
          committeeRole: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (!member) {
    redirect("/login?returnTo=/");
  }

  // Fetch upcoming events the member is registered for
  const now = new Date();
  const upcomingRegistrations = await prisma.eventRegistration.findMany({
    where: {
      memberId: session.memberId,
      status: { in: ["CONFIRMED", "PENDING"] },
      event: {
        startTime: { gte: now },
      },
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          startTime: true,
          location: true,
        },
      },
    },
    orderBy: { event: { startTime: "asc" } },
    take: 3,
  });

  // Check if membership is eligible for renewal
  const showRenewalReminder = member.membershipStatus.isEligibleForRenewal;

  // Get member's committees
  const committees = member.roleAssignments.map((ra: { committee: { id: string; name: string }; committeeRole: { name: string } }) => ({
    id: ra.committee.id,
    name: ra.committee.name,
    role: ra.committeeRole.name,
  }));

  return (
    <div data-test-id="member-dashboard" className="max-w-6xl mx-auto px-4 py-8">
      {/* Welcome Section */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {member.firstName}!
        </h1>
        <p className="text-gray-600">
          {member.membershipTier?.name || "Member"} since{" "}
          {new Date(member.joinedAt).getFullYear()}
        </p>
      </header>

      {/* Renewal Reminder */}
      {showRenewalReminder && (
        <div
          data-test-id="renewal-reminder"
          className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg"
        >
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-amber-600 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800">Membership Renewal Available</h3>
              <p className="text-sm text-amber-700 mt-1">
                Your membership is eligible for renewal. Renew now to keep enjoying all member
                benefits.
              </p>
              <Link
                href="/renew"
                className="inline-block mt-2 text-sm font-medium text-amber-800 hover:text-amber-900 underline"
              >
                Renew Membership →
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Links */}
          <section data-test-id="quick-links">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <QuickLinkCard href="/my-events" icon="calendar" label="My Events" />
              <QuickLinkCard href="/directory" icon="users" label="Directory" />
              <QuickLinkCard href="/profile" icon="user" label="My Profile" />
              <QuickLinkCard href="/settings" icon="settings" label="Settings" />
            </div>
          </section>

          {/* Upcoming Events */}
          <section data-test-id="upcoming-events">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Your Upcoming Events</h2>
              <Link href="/my-events" className="text-sm text-blue-600 hover:text-blue-800">
                View all →
              </Link>
            </div>
            {upcomingRegistrations.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-600 mb-3">You haven&apos;t registered for any events yet.</p>
                <Link
                  href="/events"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Browse Events
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingRegistrations.map((reg) => (
                  <Link
                    key={reg.id}
                    href={`/events/${reg.event.id}`}
                    className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{reg.event.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatClubDateShort(reg.event.startTime)} at{" "}
                          {formatClubTime(reg.event.startTime)}
                        </p>
                        {reg.event.location && (
                          <p className="text-sm text-gray-500 mt-0.5">{reg.event.location}</p>
                        )}
                      </div>
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                        {reg.status === "CONFIRMED" ? "Confirmed" : "Pending"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Announcements */}
          <section data-test-id="announcements">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Club Announcements</h2>
              <Link href="/announcements" className="text-sm text-blue-600 hover:text-blue-800">
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {MOCK_ANNOUNCEMENTS.map((announcement) => (
                <div
                  key={announcement.id}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-gray-900">{announcement.title}</h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                      {formatClubDateShort(announcement.date)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{announcement.excerpt}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Your Committees */}
          <section
            data-test-id="your-committees"
            className="bg-white border border-gray-200 rounded-lg p-5"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Committees</h2>
            {committees.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-600 text-sm mb-3">
                  You&apos;re not a member of any committees yet.
                </p>
                <Link
                  href="/volunteer"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Explore volunteer opportunities →
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {committees.map((committee: { id: string; name: string; role: string }) => (
                  <li key={committee.id} className="flex items-center justify-between">
                    <span className="text-gray-900">{committee.name}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {committee.role}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Member Stats */}
          <section className="bg-blue-50 border border-blue-100 rounded-lg p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Activity</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Events attended</span>
                <span className="font-semibold text-gray-900">
                  {upcomingRegistrations.length > 0 ? "3+" : "0"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Committees</span>
                <span className="font-semibold text-gray-900">{committees.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Member since</span>
                <span className="font-semibold text-gray-900">
                  {new Date(member.joinedAt).getFullYear()}
                </span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function QuickLinkCard({
  href,
  icon,
  label,
}: {
  href: string;
  icon: "calendar" | "users" | "user" | "settings";
  label: string;
}) {
  const icons = {
    calendar: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    ),
    users: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    ),
    user: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    ),
    settings: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
    ),
  };

  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
    >
      <svg
        className="w-6 h-6 text-gray-600 mb-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        {icons[icon]}
        {icon === "settings" && (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        )}
      </svg>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </Link>
  );
}
