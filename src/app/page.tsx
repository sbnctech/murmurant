/**
 * Public Home Page - Marketing-forward landing page
 *
 * URL: /
 *
 * This is the public-facing home page for visitors and prospective members.
 * Uses a stripes layout with:
 * - Hero section with CTA
 * - Upcoming events (public-safe)
 * - Gift Certificate section
 * - Photo highlights
 * - About/Join CTA
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import Link from "next/link";
import { HeroStripe, ContentStripe, Stripe } from "@/components/stripes";
import { ViewAsControl } from "@/components/view-as";
import { getViewContext } from "@/lib/view-context";

// ============================================================================
// Public Home Page Component
// ============================================================================

export default async function PublicHomePage() {
  const viewContext = await getViewContext();

  return (
    <div data-test-id="public-home-page">
      {/* Header with View As control */}
      <header
        style={{
          position: "sticky",
          top: viewContext.isSimulated ? "32px" : 0,
          zIndex: 100,
          backgroundColor: "var(--token-color-surface)",
          borderBottom: "1px solid var(--token-color-border)",
          padding: "var(--token-space-sm) var(--token-space-md)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: "var(--token-text-lg)",
            fontWeight: 700,
            color: "var(--token-color-text)",
            textDecoration: "none",
          }}
        >
          SBNC
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: "var(--token-space-md)" }}>
          <Link
            href="/member"
            style={{
              fontSize: "var(--token-text-sm)",
              color: "var(--token-color-text-muted)",
              textDecoration: "none",
            }}
          >
            Member Portal
          </Link>
          <Link
            href="/login"
            style={{
              fontSize: "var(--token-text-sm)",
              padding: "var(--token-space-xs) var(--token-space-md)",
              backgroundColor: "var(--token-color-primary)",
              color: "#fff",
              borderRadius: "var(--token-radius-lg)",
              textDecoration: "none",
            }}
          >
            Sign In
          </Link>
          <ViewAsControl />
        </nav>
      </header>

      {/* Hero Section */}
      <HeroStripe
        testId="hero-stripe"
        subtitle="Santa Barbara Newcomers Club"
        title="Making Connections, Building Community"
        description="Join a vibrant community of newcomers and long-time residents exploring all that Santa Barbara has to offer. Activities, friendships, and memories await."
        background="primary-gradient"
        actions={
          <>
            <Link
              href="/join"
              data-test-id="hero-join-button"
              style={{
                padding: "var(--token-space-sm) var(--token-space-lg)",
                backgroundColor: "#fff",
                color: "var(--token-color-primary)",
                borderRadius: "var(--token-radius-lg)",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Join SBNC
            </Link>
            <Link
              href="#events"
              style={{
                padding: "var(--token-space-sm) var(--token-space-lg)",
                backgroundColor: "transparent",
                color: "#fff",
                border: "2px solid #fff",
                borderRadius: "var(--token-radius-lg)",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Explore Events
            </Link>
          </>
        }
      />

      {/* Gift Certificate CTA */}
      <Stripe background="muted" padding="md" testId="gift-certificate-stripe">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "var(--token-space-md)",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "var(--token-text-xl)",
                fontWeight: 600,
                color: "var(--token-color-text)",
                marginTop: 0,
                marginBottom: "var(--token-space-xs)",
              }}
            >
              Gift the Joy of Connection
            </h2>
            <p
              style={{
                fontSize: "var(--token-text-base)",
                color: "var(--token-color-text-muted)",
                margin: 0,
              }}
            >
              Know someone new to Santa Barbara? Give them a membership gift certificate.
            </p>
          </div>
          <Link
            href="/gift"
            data-test-id="gift-certificate-link"
            style={{
              padding: "var(--token-space-sm) var(--token-space-lg)",
              backgroundColor: "var(--token-color-primary)",
              color: "#fff",
              borderRadius: "var(--token-radius-lg)",
              fontWeight: 600,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Gift Certificate
          </Link>
        </div>
      </Stripe>

      {/* Upcoming Events */}
      <ContentStripe
        testId="upcoming-events-stripe"
        title="Upcoming Events"
        subtitle="Open to members and guests"
        padding="lg"
        headerAlign="center"
      >
        <div
          id="events"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "var(--token-space-md)",
          }}
        >
          {/* Demo event cards */}
          <EventCard
            title="Monthly Luncheon"
            date="January 15, 2025"
            location="The Biltmore"
            description="Join us for our monthly gathering featuring guest speaker Dr. Smith on local history."
          />
          <EventCard
            title="Wine Country Excursion"
            date="January 25, 2025"
            location="Santa Ynez Valley"
            description="A guided tour of three renowned wineries with lunch included."
          />
          <EventCard
            title="Book Club"
            date="January 22, 2025"
            location="Member's Home"
            description="This month we're discussing 'The Lincoln Highway' by Amor Towles."
          />
        </div>
        <div style={{ textAlign: "center", marginTop: "var(--token-space-lg)" }}>
          <Link
            href="/events"
            style={{
              color: "var(--token-color-primary)",
              fontSize: "var(--token-text-base)",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            View All Events
          </Link>
        </div>
      </ContentStripe>

      {/* Photo Highlights */}
      <ContentStripe
        testId="photo-highlights-stripe"
        title="Club Highlights"
        subtitle="Memories from recent events"
        background="muted"
        padding="lg"
        headerAlign="center"
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "var(--token-space-sm)",
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                aspectRatio: "1",
                borderRadius: "var(--token-radius-lg)",
                overflow: "hidden",
                backgroundColor: "var(--token-color-surface)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://picsum.photos/seed/public${i}/300/300`}
                alt={`Club highlight ${i}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          ))}
        </div>
        <style>{`
          @media (max-width: 768px) {
            [data-test-id="photo-highlights-stripe"] > div > div:first-child {
              grid-template-columns: repeat(2, 1fr);
            }
          }
        `}</style>
      </ContentStripe>

      {/* About / Join CTA */}
      <HeroStripe
        testId="about-cta-stripe"
        title="Ready to Make New Friends?"
        description="SBNC welcomes newcomers to Santa Barbara and those who want to expand their social circle. Join a community that celebrates connection, exploration, and the best of the Central Coast."
        background="dark"
        actions={
          <>
            <Link
              href="/join"
              style={{
                padding: "var(--token-space-sm) var(--token-space-lg)",
                backgroundColor: "#fff",
                color: "#1f2937",
                borderRadius: "var(--token-radius-lg)",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Become a Member
            </Link>
            <Link
              href="/about"
              style={{
                padding: "var(--token-space-sm) var(--token-space-lg)",
                backgroundColor: "transparent",
                color: "#fff",
                border: "2px solid #fff",
                borderRadius: "var(--token-radius-lg)",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Learn More
            </Link>
          </>
        }
      />

      {/* Footer */}
      <footer
        style={{
          backgroundColor: "#111827",
          color: "#9ca3af",
          padding: "var(--token-space-lg) var(--token-space-md)",
          textAlign: "center",
          fontSize: "var(--token-text-sm)",
        }}
      >
        <p style={{ margin: 0 }}>
          Santa Barbara Newcomers Club - Established 1965
        </p>
        <p style={{ margin: "var(--token-space-xs) 0 0 0" }}>
          Making connections, building community
        </p>
      </footer>
    </div>
  );
}

// ============================================================================
// Event Card Component (inline for public page)
// ============================================================================

interface EventCardProps {
  title: string;
  date: string;
  location: string;
  description: string;
}

function EventCard({ title, date, location, description }: EventCardProps) {
  return (
    <div
      style={{
        backgroundColor: "var(--token-color-surface)",
        border: "1px solid var(--token-color-border)",
        borderRadius: "var(--token-radius-lg)",
        padding: "var(--token-space-md)",
      }}
    >
      <div
        style={{
          fontSize: "var(--token-text-sm)",
          color: "var(--token-color-primary)",
          fontWeight: 600,
          marginBottom: "var(--token-space-xs)",
        }}
      >
        {date}
      </div>
      <h3
        style={{
          fontSize: "var(--token-text-lg)",
          fontWeight: 600,
          color: "var(--token-color-text)",
          marginTop: 0,
          marginBottom: "var(--token-space-xs)",
        }}
      >
        {title}
      </h3>
      <div
        style={{
          fontSize: "var(--token-text-sm)",
          color: "var(--token-color-text-muted)",
          marginBottom: "var(--token-space-sm)",
        }}
      >
        {location}
      </div>
      <p
        style={{
          fontSize: "var(--token-text-sm)",
          color: "var(--token-color-text)",
          margin: 0,
          lineHeight: "var(--token-leading-normal)",
        }}
      >
        {description}
      </p>
    </div>
  );
}
