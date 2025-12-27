// Copyright (c) Santa Barbara Newcomers Club
// About page - club history, mission, leadership, and contact information

import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "About Us | Santa Barbara Newcomers Club",
  description:
    "Learn about the Santa Barbara Newcomers Club - making friends since 1962. Discover our history, mission, and leadership.",
};

// Mock leadership data - in production, this would come from the database
const LEADERSHIP_TEAM = [
  { name: "President", role: "President", initials: "P" },
  { name: "Vice President", role: "Vice President", initials: "VP" },
  { name: "Secretary", role: "Secretary", initials: "S" },
  { name: "Treasurer", role: "Treasurer", initials: "T" },
  { name: "Membership Chair", role: "Membership Chair", initials: "MC" },
  { name: "Events Chair", role: "Events Chair", initials: "EC" },
];

export default async function AboutPage() {
  // Fetch active member count for social proof
  const memberCount = await prisma.member.count({
    where: {
      membershipStatus: {
        isActive: true,
      },
    },
  });

  // Fetch committee count
  const committeeCount = await prisma.committee.count({
    where: { isActive: true },
  });

  return (
    <div data-theme="sbnc" className="min-h-screen bg-[var(--token-color-background)]">
      {/* Header */}
      <header className="bg-[var(--token-color-surface)] border-b border-[var(--token-color-border)] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--token-color-primary)] flex items-center justify-center">
              <span className="text-white font-bold text-lg">SB</span>
            </div>
            <div>
              <h1 className="font-semibold text-[var(--token-color-text)]">
                Santa Barbara Newcomers Club
              </h1>
              <p className="text-sm text-[var(--token-color-text-muted)]">Making friends since 1962</p>
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/events"
              className="text-[var(--token-color-text-muted)] hover:text-[var(--token-color-text)]"
            >
              Events
            </Link>
            <Link
              href="/join"
              className="px-4 py-2 bg-[var(--token-color-primary)] text-white rounded-lg font-medium hover:bg-[var(--token-color-primary-hover)]"
            >
              Join Us
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section
        data-test-id="about-hero"
        className="bg-gradient-to-br from-[#1a365d] to-[#2c5282] text-white py-20 px-6"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About Our Club</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            For over 60 years, the Santa Barbara Newcomers Club has been helping people find
            friendship, connection, and community in one of California&apos;s most beautiful cities.
          </p>
        </div>
      </section>

      {/* Mission Statement */}
      <section data-test-id="about-mission" className="py-16 px-6 bg-[var(--token-color-surface)]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[var(--token-color-text)] mb-4">Our Mission</h2>
            <div className="w-16 h-1 bg-[var(--token-color-primary)] mx-auto rounded-full" />
          </div>
          <div className="bg-[var(--token-color-surface-2)] rounded-xl p-8 text-center">
            <p className="text-xl text-[var(--token-color-text)] leading-relaxed">
              To provide a welcoming community where newcomers to Santa Barbara can make meaningful
              friendships, discover local activities, and feel at home in their new city through
              social events, interest groups, and volunteer opportunities.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mt-10">
            <div className="text-center">
              <div className="text-4xl font-bold text-[var(--token-color-primary)]">
                {memberCount || "500+"}
              </div>
              <div className="text-[var(--token-color-text-muted)] mt-1">Active Members</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[var(--token-color-primary)]">
                {committeeCount || "20+"}
              </div>
              <div className="text-[var(--token-color-text-muted)] mt-1">Interest Groups</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[var(--token-color-primary)]">60+</div>
              <div className="text-[var(--token-color-text-muted)] mt-1">Years of Friendship</div>
            </div>
          </div>
        </div>
      </section>

      {/* Club History */}
      <section data-test-id="about-history" className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[var(--token-color-text)] mb-4">Our History</h2>
            <div className="w-16 h-1 bg-[var(--token-color-primary)] mx-auto rounded-full" />
          </div>

          <div className="space-y-8">
            <div className="bg-[var(--token-color-surface)] rounded-xl p-6 border border-[var(--token-color-border)]">
              <h3 className="text-xl font-semibold text-[var(--token-color-text)] mb-3">
                Founded in 1962
              </h3>
              <p className="text-[var(--token-color-text-muted)] leading-relaxed">
                The Santa Barbara Newcomers Club was founded by a small group of women who recognized
                that moving to a new city can be challenging. They wanted to create a welcoming space
                where newcomers could meet others in the same situation and form lasting friendships.
              </p>
            </div>

            <div className="bg-[var(--token-color-surface)] rounded-xl p-6 border border-[var(--token-color-border)]">
              <h3 className="text-xl font-semibold text-[var(--token-color-text)] mb-3">
                Growing Together
              </h3>
              <p className="text-[var(--token-color-text-muted)] leading-relaxed">
                Over the decades, the club has grown from a handful of members to hundreds of active
                participants. We&apos;ve expanded from simple coffee meetups to offering dozens of
                interest groups, from hiking and wine tasting to book clubs and golf outings.
              </p>
            </div>

            <div className="bg-[var(--token-color-surface)] rounded-xl p-6 border border-[var(--token-color-border)]">
              <h3 className="text-xl font-semibold text-[var(--token-color-text)] mb-3">
                Today and Beyond
              </h3>
              <p className="text-[var(--token-color-text-muted)] leading-relaxed">
                Today, we continue our founders&apos; mission with modern tools and the same warm
                spirit. Whether you just moved to Santa Barbara or have been here a few years,
                there&apos;s always room for one more friend at our table.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section
        data-test-id="about-leadership"
        className="py-16 px-6 bg-[var(--token-color-surface)]"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[var(--token-color-text)] mb-4">
              Our Leadership Team
            </h2>
            <div className="w-16 h-1 bg-[var(--token-color-primary)] mx-auto rounded-full" />
            <p className="text-[var(--token-color-text-muted)] mt-4 max-w-2xl mx-auto">
              Our club is run entirely by volunteers who donate their time to keep our community
              thriving.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {LEADERSHIP_TEAM.map((leader) => (
              <div
                key={leader.role}
                className="bg-[var(--token-color-background)] rounded-xl p-6 text-center border border-[var(--token-color-border)]"
              >
                <div className="w-20 h-20 rounded-full bg-[var(--token-color-primary)] mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">{leader.initials}</span>
                </div>
                <h3 className="font-semibold text-[var(--token-color-text)]">{leader.role}</h3>
                <p className="text-sm text-[var(--token-color-text-muted)] mt-1">Board Member</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join CTA */}
      <section data-test-id="about-cta" className="py-20 px-6 bg-[var(--token-color-primary)]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Join?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Whether you&apos;re brand new to Santa Barbara or have been here a while and want to
            expand your social circle, we&apos;d love to welcome you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/join"
              data-test-id="about-join-button"
              className="px-8 py-4 bg-white text-[var(--token-color-primary)] font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Become a Member
            </Link>
            <Link
              href="/events"
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
            >
              Browse Events
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section data-test-id="about-contact" className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[var(--token-color-text)] mb-4">Contact Us</h2>
            <div className="w-16 h-1 bg-[var(--token-color-primary)] mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[var(--token-color-surface)] rounded-xl p-6 text-center border border-[var(--token-color-border)]">
              <div className="w-12 h-12 rounded-full bg-[var(--token-color-surface-2)] mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[var(--token-color-primary)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-[var(--token-color-text)] mb-2">Email</h3>
              <a
                href="mailto:info@sbnewcomers.org"
                className="text-[var(--token-color-primary)] hover:underline"
              >
                info@sbnewcomers.org
              </a>
            </div>

            <div className="bg-[var(--token-color-surface)] rounded-xl p-6 text-center border border-[var(--token-color-border)]">
              <div className="w-12 h-12 rounded-full bg-[var(--token-color-surface-2)] mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[var(--token-color-primary)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-[var(--token-color-text)] mb-2">Location</h3>
              <p className="text-[var(--token-color-text-muted)]">
                Santa Barbara, CA
                <br />
                and surrounding areas
              </p>
            </div>

            <div className="bg-[var(--token-color-surface)] rounded-xl p-6 text-center border border-[var(--token-color-border)]">
              <div className="w-12 h-12 rounded-full bg-[var(--token-color-surface-2)] mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[var(--token-color-primary)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-[var(--token-color-text)] mb-2">Website</h3>
              <a
                href="https://sbnewcomers.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--token-color-primary)] hover:underline"
              >
                sbnewcomers.org
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--token-color-border)] bg-[var(--token-color-surface)] py-8 px-6">
        <div className="max-w-4xl mx-auto text-center text-sm text-[var(--token-color-text-muted)]">
          <p>&copy; {new Date().getFullYear()} Santa Barbara Newcomers Club. All rights reserved.</p>
          <p className="mt-2">Making friends since 1962</p>
        </div>
      </footer>
    </div>
  );
}
