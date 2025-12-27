/**
 * Demo Landing Component
 *
 * Provides unified navigation for the demo page:
 * - Hero section with "ClubOS for SBNC" branding
 * - Tab navigation: Overview | Workflows | Transition | Officers
 * - Summary stats cards
 *
 * Charter: P7 (observability is a product feature)
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Stats = {
  memberCount: number | null;
  eventCount: number | null;
  registrationCount: number | null;
  committeeCount: number | null;
};

function StatCard({ label, value, loading }: { label: string; value: number | null; loading: boolean }) {
  return (
    <div
      style={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        minWidth: "150px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: "32px", fontWeight: 700, color: "#1a365d" }}>
        {loading ? "..." : value !== null ? String(value) : "-"}
      </div>
    </div>
  );
}

function TabLink({ href, label, active }: { href: string; label: string; active?: boolean }) {
  return (
    <a
      href={href}
      style={{
        display: "inline-block",
        padding: "12px 24px",
        borderBottom: active ? "3px solid #1a365d" : "3px solid transparent",
        color: active ? "#1a365d" : "#666",
        textDecoration: "none",
        fontWeight: active ? 600 : 500,
        fontSize: "15px",
        transition: "border-color 0.2s",
      }}
    >
      {label}
    </a>
  );
}

export default function DemoLanding({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<Stats>({
    memberCount: null,
    eventCount: null,
    registrationCount: null,
    committeeCount: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch member count
        const membersRes = await fetch("/api/v1/admin/members?status=active&limit=1");
        const membersData = membersRes.ok ? await membersRes.json() : null;
        const memberCount = membersData?.pagination?.total ?? membersData?.members?.length ?? null;

        // Fetch event count (upcoming)
        const now = new Date().toISOString();
        const eventsRes = await fetch(`/api/v1/events?after=${now}&limit=1`);
        const eventsData = eventsRes.ok ? await eventsRes.json() : null;
        const eventCount = eventsData?.pagination?.total ?? eventsData?.events?.length ?? null;

        // Fetch committees
        const committeesRes = await fetch("/api/v1/committees");
        const committeesData = committeesRes.ok ? await committeesRes.json() : null;
        const committeeCount = committeesData?.committees?.length ?? null;

        // Fetch this month registrations
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        const regsRes = await fetch(`/api/v1/admin/registrations?after=${startOfMonth}&limit=1`);
        const regsData = regsRes.ok ? await regsRes.json() : null;
        const registrationCount = regsData?.pagination?.total ?? regsData?.registrations?.length ?? null;

        setStats({ memberCount, eventCount, registrationCount, committeeCount });
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Hero Section */}
      <header
        data-test-id="demo-hero"
        style={{
          background: "linear-gradient(135deg, #1a365d 0%, #2c5282 100%)",
          color: "white",
          padding: "48px 32px",
          borderRadius: "0 0 16px 16px",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "24px" }}>
          <div>
            <h1 style={{ fontSize: "36px", margin: "0 0 12px 0", fontWeight: 700 }}>
              ClubOS for SBNC
            </h1>
            <p style={{ fontSize: "18px", margin: 0, opacity: 0.9 }}>
              The modern platform replacing Wild Apricot — built for volunteer-run clubs
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <a
              href="#workflows"
              data-test-id="start-demo-button"
              style={{
                display: "inline-block",
                padding: "14px 28px",
                backgroundColor: "#48bb78",
                color: "white",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "16px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              }}
            >
              Start Demo
            </a>
            <Link
              href="/admin"
              style={{
                display: "inline-block",
                padding: "14px 28px",
                backgroundColor: "rgba(255,255,255,0.15)",
                color: "white",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: 500,
                fontSize: "16px",
              }}
            >
              Back to Admin
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginTop: "32px",
            flexWrap: "wrap",
          }}
        >
          <StatCard label="Active Members" value={stats.memberCount} loading={loading} />
          <StatCard label="Upcoming Events" value={stats.eventCount} loading={loading} />
          <StatCard label="This Month Registrations" value={stats.registrationCount} loading={loading} />
          <StatCard label="Committees" value={stats.committeeCount} loading={loading} />
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav
        data-test-id="demo-tabs"
        style={{
          display: "flex",
          borderBottom: "1px solid #ddd",
          marginBottom: "32px",
          overflowX: "auto",
          padding: "0 20px",
        }}
      >
        <TabLink href="#overview" label="Overview" />
        <TabLink href="#workflows" label="Workflows" />
        <TabLink href="#transition" label="Transition" />
        <TabLink href="#officers" label="For Officers" />
      </nav>

      {/* Content */}
      <div style={{ padding: "0 20px 40px" }}>
        {children}
      </div>

      {/* Quick Links Footer */}
      <section
        data-test-id="demo-quick-links"
        style={{
          margin: "0 20px 40px",
          padding: "16px 20px",
          backgroundColor: "#e7f3ff",
          borderRadius: "8px",
          display: "flex",
          gap: "24px",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontWeight: 500, color: "#0066cc" }}>Quick Links:</span>
        <Link href="/admin/demo/members" style={{ color: "#0066cc" }}>
          Member List
        </Link>
        <Link href="/admin/members" style={{ color: "#0066cc" }}>
          Member Admin
        </Link>
        <Link href="/admin/events" style={{ color: "#0066cc" }}>
          Events Admin
        </Link>
        <Link href="/admin/governance" style={{ color: "#0066cc" }}>
          Governance
        </Link>
      </section>
    </div>
  );
}
