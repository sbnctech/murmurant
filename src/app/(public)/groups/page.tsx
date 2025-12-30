/**
 * Public Activity Groups Directory
 *
 * Displays approved activity groups to the public with a CTA to join the club.
 * This page is accessible without authentication.
 *
 * Charter: P6 (human-first UI), P2 (public view of approved-only data)
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import Link from "next/link";
import { prisma } from "@/lib/prisma";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface PublicGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  schedule: string | null;
  imageEmoji: string | null;
  memberCount: number;
  coordinatorName: string | null;
}

// -----------------------------------------------------------------------------
// Data Fetching
// -----------------------------------------------------------------------------

async function getPublicGroups(): Promise<PublicGroup[]> {
  const groups = await prisma.activityGroup.findMany({
    where: {
      status: "APPROVED",
      isPublic: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      category: true,
      schedule: true,
      imageEmoji: true,
      members: {
        where: { leftAt: null },
        select: {
          role: true,
          member: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return groups.map((g) => {
    const coordinator = g.members.find((m) => m.role === "COORDINATOR");
    return {
      id: g.id,
      name: g.name,
      slug: g.slug,
      description: g.description,
      category: g.category,
      schedule: g.schedule,
      imageEmoji: g.imageEmoji,
      memberCount: g.members.length,
      coordinatorName: coordinator
        ? `${coordinator.member.firstName} ${coordinator.member.lastName}`
        : null,
    };
  });
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

function getCategoryColor(category: string | null): { bg: string; text: string } {
  switch (category) {
    case "Arts & Culture":
      return { bg: "bg-amber-100", text: "text-amber-800" };
    case "Outdoor":
      return { bg: "bg-green-100", text: "text-green-800" };
    case "Social":
      return { bg: "bg-blue-100", text: "text-blue-800" };
    case "Games":
      return { bg: "bg-indigo-100", text: "text-indigo-800" };
    case "Hobbies":
      return { bg: "bg-pink-100", text: "text-pink-800" };
    default:
      return { bg: "bg-gray-100", text: "text-gray-700" };
  }
}

// -----------------------------------------------------------------------------
// Components
// -----------------------------------------------------------------------------

function GroupCard({ group }: { group: PublicGroup }) {
  const categoryColor = getCategoryColor(group.category);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <span className="text-4xl">{group.imageEmoji || "👥"}</span>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
            {group.category && (
              <span
                className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${categoryColor.bg} ${categoryColor.text}`}
              >
                {group.category}
              </span>
            )}
          </div>
        </div>

        {group.description && (
          <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
            {group.description}
          </p>
        )}

        <div className="text-sm text-gray-500 space-y-1">
          {group.schedule && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>{group.schedule}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span>{group.memberCount} members</span>
          </div>
          {group.coordinatorName && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>Coordinator: {group.coordinatorName}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GroupStats({ groups }: { groups: PublicGroup[] }) {
  const totalMembers = groups.reduce((sum, g) => sum + g.memberCount, 0);
  const categories = new Set(groups.map((g) => g.category).filter(Boolean));

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <div className="text-3xl font-bold text-blue-600">{groups.length}</div>
        <div className="text-sm text-gray-500">Active Groups</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <div className="text-3xl font-bold text-green-600">{totalMembers}</div>
        <div className="text-sm text-gray-500">Group Members</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <div className="text-3xl font-bold text-indigo-600">{categories.size}</div>
        <div className="text-sm text-gray-500">Categories</div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Page Component
// -----------------------------------------------------------------------------

export default async function PublicGroupsPage() {
  const groups = await getPublicGroups();

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div data-test-id="groups-hero" className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Activity Groups</h1>
          <p className="mt-2 text-lg text-gray-600">
            Our activity groups bring members together around shared interests and hobbies.
            From book clubs to hiking adventures, there&apos;s something for everyone.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {groups.length > 0 && <GroupStats groups={groups} />}

        {/* Groups List */}
        <section data-test-id="groups-list">
          {groups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Activity Groups Coming Soon
              </h3>
              <p className="text-gray-600">
                We&apos;re building our activity groups program. Join the club to be the first
                to know when new groups are available!
              </p>
            </div>
          )}
        </section>

        {/* Join CTA */}
        <div className="mt-12 bg-blue-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-900">
            Want to Join an Activity Group?
          </h2>
          <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
            Activity groups are exclusive to club members. Become a member today to join
            groups, propose new ones, and connect with others who share your interests.
          </p>
          <Link
            href="/join"
            data-test-id="groups-join-cta"
            className="mt-4 inline-flex items-center px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Become a Member
          </Link>
        </div>

        {/* About Activity Groups */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            About Our Activity Groups
          </h3>
          <div className="text-gray-600 space-y-3">
            <p>
              Activity groups are member-led gatherings organized around shared interests.
              Unlike formal committees, these groups offer a relaxed way to explore hobbies
              and activities with fellow club members.
            </p>
            <p>
              Each group has a coordinator who organizes meetings and events. Groups meet
              on their own schedules—some weekly, others monthly—and many host special
              events throughout the year.
            </p>
            <p>
              Members can join as many groups as they like. Have an idea for a new group?
              Members can propose new activity groups, which are reviewed and approved
              by the Activities Committee.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
