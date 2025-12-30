// Copyright © 2025 Murmurant, Inc.
// Committees listing page - public view of all club committees

import Link from "next/link";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface CommitteeChair {
  name: string;
  photoUrl?: string;
}

interface Committee {
  id: string;
  name: string;
  description: string;
  chair: CommitteeChair;
  memberCount: number;
  meetingSchedule?: string;
  acceptingMembers: boolean;
}

// -----------------------------------------------------------------------------
// Mock Data
// -----------------------------------------------------------------------------

const committees: Committee[] = [
  {
    id: "activities",
    name: "Activities Committee",
    description:
      "Plans and organizes social events, outings, and recreational activities for club members. From wine tastings to hiking trips, we create opportunities for members to connect and explore Santa Barbara together.",
    chair: { name: "Margaret Chen", photoUrl: "/avatars/placeholder.png" },
    memberCount: 18,
    meetingSchedule: "2nd Tuesday, 10:00 AM",
    acceptingMembers: true,
  },
  {
    id: "membership",
    name: "Membership Committee",
    description:
      "Welcomes new members, processes applications, and ensures smooth onboarding. We host new member orientations and help newcomers find their place in our community.",
    chair: { name: "Robert Williams", photoUrl: "/avatars/placeholder.png" },
    memberCount: 12,
    meetingSchedule: "1st Monday, 9:30 AM",
    acceptingMembers: true,
  },
  {
    id: "hospitality",
    name: "Hospitality Committee",
    description:
      "Coordinates refreshments and setup for club events and meetings. We ensure every gathering feels welcoming and well-organized for all attendees.",
    chair: { name: "Susan Martinez", photoUrl: "/avatars/placeholder.png" },
    memberCount: 15,
    meetingSchedule: "As needed before events",
    acceptingMembers: true,
  },
  {
    id: "programs",
    name: "Programs Committee",
    description:
      "Arranges speakers and educational presentations for monthly luncheons. We bring interesting topics and engaging presenters to enrich our members' experience.",
    chair: { name: "David Thompson", photoUrl: "/avatars/placeholder.png" },
    memberCount: 8,
    meetingSchedule: "3rd Wednesday, 2:00 PM",
    acceptingMembers: false,
  },
  {
    id: "communications",
    name: "Communications Committee",
    description:
      "Manages the club newsletter, website, and social media presence. We keep members informed about upcoming events, member news, and community happenings.",
    chair: { name: "Jennifer Lee", photoUrl: "/avatars/placeholder.png" },
    memberCount: 6,
    meetingSchedule: "Weekly, Thursdays 11:00 AM",
    acceptingMembers: true,
  },
  {
    id: "interest-groups",
    name: "Interest Groups Committee",
    description:
      "Oversees and supports the various special interest groups within the club. From book clubs to golf groups, we help members pursue shared hobbies and passions.",
    chair: { name: "Patricia Anderson", photoUrl: "/avatars/placeholder.png" },
    memberCount: 10,
    meetingSchedule: "Quarterly",
    acceptingMembers: true,
  },
  {
    id: "community-service",
    name: "Community Service Committee",
    description:
      "Coordinates volunteer opportunities and charitable activities. We organize drives, fundraisers, and service projects that give back to the Santa Barbara community.",
    chair: { name: "Michael Brown", photoUrl: "/avatars/placeholder.png" },
    memberCount: 14,
    meetingSchedule: "Last Friday, 10:00 AM",
    acceptingMembers: true,
  },
  {
    id: "finance",
    name: "Finance Committee",
    description:
      "Oversees the club's budget, financial planning, and fiscal responsibility. We ensure transparent stewardship of member dues and club resources.",
    chair: { name: "Elizabeth Davis", photoUrl: "/avatars/placeholder.png" },
    memberCount: 5,
    acceptingMembers: false,
  },
];

// -----------------------------------------------------------------------------
// Committee Card Component
// -----------------------------------------------------------------------------

function CommitteeCard({ committee }: { committee: Committee }) {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900">{committee.name}</h3>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-gray-600">{committee.memberCount} members</span>
          {committee.acceptingMembers ? (
            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
              Open to new members
            </span>
          ) : (
            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
              Currently full
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-4">
        <p className="text-gray-600 text-sm leading-relaxed">{committee.description}</p>

        {/* Chair Info */}
        <div className="mt-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium overflow-hidden">
            {committee.chair.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={committee.chair.photoUrl}
                alt={committee.chair.name}
                className="w-full h-full object-cover"
              />
            ) : (
              committee.chair.name
                .split(" ")
                .map((n) => n[0])
                .join("")
            )}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{committee.chair.name}</div>
            <div className="text-xs text-gray-500">Committee Chair</div>
          </div>
        </div>

        {/* Meeting Schedule */}
        {committee.meetingSchedule && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>Meets: {committee.meetingSchedule}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        {committee.acceptingMembers ? (
          <Link
            href={`/committees/${committee.id}/join`}
            className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Join Committee
          </Link>
        ) : (
          <Link
            href={`/committees/${committee.id}`}
            className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
          >
            Learn More
          </Link>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Summary Stats
// -----------------------------------------------------------------------------

function CommitteeStats() {
  const totalCommittees = committees.length;
  const totalMembers = committees.reduce((sum, c) => sum + c.memberCount, 0);
  const openCommittees = committees.filter((c) => c.acceptingMembers).length;

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <div className="text-3xl font-bold text-blue-600">{totalCommittees}</div>
        <div className="text-sm text-gray-500">Active Committees</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <div className="text-3xl font-bold text-green-600">{totalMembers}</div>
        <div className="text-sm text-gray-500">Committee Members</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <div className="text-3xl font-bold text-indigo-600">{openCommittees}</div>
        <div className="text-sm text-gray-500">Accepting Members</div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Page Component
// -----------------------------------------------------------------------------

export default function CommitteesPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Club Committees</h1>
          <p className="mt-2 text-lg text-gray-600">
            Our committees are the backbone of the Santa Barbara Newcomers Club. Join a committee to
            get involved, meet fellow members, and help shape our community.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <CommitteeStats />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {committees.map((committee) => (
            <CommitteeCard key={committee.id} committee={committee} />
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-12 bg-blue-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Want to Start a New Committee?</h2>
          <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
            Have an idea for a new committee that would benefit our members? We&apos;re always open
            to new initiatives. Contact the Board to discuss your proposal.
          </p>
          <Link
            href="/contact"
            className="mt-4 inline-flex items-center px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Contact the Board
          </Link>
        </div>
      </div>
    </main>
  );
}
