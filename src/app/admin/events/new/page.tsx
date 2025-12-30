/**
 * Create New Event Page
 *
 * URL: /admin/events/new
 *
 * Admin form for creating a new event with clear field intelligence:
 * - Required fields labeled
 * - Optional fields labeled
 * - Calculated fields shown in preview panel
 *
 * Charter: P1 (explicit state), N4 (no hidden rules)
 *
 * Copyright © 2025 Murmurant, Inc.
 */

"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import EventForm, { EventFormData } from "@/components/admin/events/EventForm";

export default function NewEventPage() {
  const router = useRouter();

  const handleSubmit = async (data: EventFormData) => {
    // Build request body
    const body: Record<string, unknown> = {
      title: data.title.trim(),
      startTime: new Date(data.startTime).toISOString(),
      isPublished: data.isPublished,
    };

    // Optional fields
    if (data.description.trim()) {
      body.description = data.description.trim();
    }
    if (data.category.trim()) {
      body.category = data.category.trim();
    }
    if (data.location.trim()) {
      body.location = data.location.trim();
    }
    if (data.endTime) {
      body.endTime = new Date(data.endTime).toISOString();
    }
    if (data.capacity) {
      const cap = parseInt(data.capacity, 10);
      if (!isNaN(cap) && cap >= 0) {
        body.capacity = cap;
      }
    }
    if (data.eventChairId) {
      body.eventChairId = data.eventChairId;
    }

    const res = await fetch("/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to create event");
    }

    const result = await res.json();
    router.push(`/admin/events/${result.event.id}`);
  };

  const handleCancel = () => {
    router.push("/admin/events");
  };

  return (
    <div data-test-id="admin-event-new-page" style={{ padding: "20px", maxWidth: "1000px" }}>
      {/* Breadcrumb */}
      <nav style={{ marginBottom: "16px", fontSize: "14px" }}>
        <Link href="/admin/events" style={{ color: "#6b7280", textDecoration: "none" }}>
          Events
        </Link>
        <span style={{ margin: "0 8px", color: "#9ca3af" }}>/</span>
        <span style={{ color: "#1f2937" }}>New Event</span>
      </nav>

      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 8px 0", color: "#1f2937" }}>
          Create New Event
        </h1>
        <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
          Fill in the required fields. Murmurant will calculate status, availability, and urgency automatically.
        </p>
      </div>

      {/* Form */}
      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "24px",
        }}
      >
        <EventForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  );
}
