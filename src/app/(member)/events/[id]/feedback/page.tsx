// Copyright © 2025 Murmurant, Inc.
// Event feedback/survey page

"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatClubDateLong } from "@/lib/timezone";

// Mock event data - in production would fetch based on id
const mockEvent = {
  id: "evt-123",
  name: "Wine Tasting at Local Vineyard",
  date: "2024-12-15",
  time: "2:00 PM",
  location: "Santa Barbara Wine Country",
};

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
}

function StarRating({ rating, onRatingChange }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div style={{ display: "flex", gap: "8px" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          data-test-id={`star-${star}`}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "32px",
            padding: "4px",
            color: star <= (hoverRating || rating) ? "#f59e0b" : "#d1d5db",
            transition: "color 0.15s, transform 0.15s",
            transform: star <= (hoverRating || rating) ? "scale(1.1)" : "scale(1)",
          }}
          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function getRatingLabel(rating: number): string {
  switch (rating) {
    case 1:
      return "Poor";
    case 2:
      return "Fair";
    case 3:
      return "Good";
    case 4:
      return "Very Good";
    case 5:
      return "Excellent";
    default:
      return "";
  }
}

export default function EventFeedbackPage() {
  const params = useParams();
  const eventId = params.id as string;

  // Form state
  const [rating, setRating] = useState(0);
  const [enjoyedText, setEnjoyedText] = useState("");
  const [improvedText, setImprovedText] = useState("");
  const [attendAgain, setAttendAgain] = useState<boolean | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      alert("Please select a rating before submitting.");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In production, would submit to API
    console.log("Feedback submitted:", {
      eventId,
      rating,
      enjoyedText,
      improvedText,
      attendAgain,
      isAnonymous,
    });

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  // Thank you message after submission
  if (isSubmitted) {
    return (
      <div
        data-test-id="feedback-thank-you"
        style={{
          maxWidth: "600px",
          textAlign: "center",
          padding: "48px 24px",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            backgroundColor: "#d1fae5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <span style={{ fontSize: "40px" }}>✓</span>
        </div>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: "#1f2937",
            marginBottom: "12px",
          }}
        >
          Thank You for Your Feedback!
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: "#6b7280",
            marginBottom: "24px",
          }}
        >
          Your feedback helps us improve future events and create better
          experiences for all members.
        </p>
        <Link
          href="/events"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            backgroundColor: "#2563eb",
            color: "white",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Browse More Events
        </Link>
      </div>
    );
  }

  return (
    <div data-test-id="event-feedback-page" style={{ maxWidth: "600px" }}>
      {/* Event Header */}
      <div
        style={{
          backgroundColor: "#f9fafb",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "32px",
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "#1f2937",
            marginBottom: "8px",
          }}
        >
          {mockEvent.name}
        </h1>
        <p style={{ fontSize: "16px", color: "#6b7280", margin: 0 }}>
          {formatClubDateLong(new Date(mockEvent.date))} at {mockEvent.time}
        </p>
      </div>

      <h2
        style={{
          fontSize: "20px",
          fontWeight: 600,
          color: "#1f2937",
          marginBottom: "24px",
        }}
      >
        Share Your Feedback
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Overall Rating */}
        <div style={{ marginBottom: "32px" }}>
          <label
            style={{
              display: "block",
              fontWeight: 500,
              color: "#374151",
              marginBottom: "12px",
            }}
          >
            Overall Rating <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <StarRating rating={rating} onRatingChange={setRating} />
          {rating > 0 && (
            <p
              style={{
                marginTop: "8px",
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              {getRatingLabel(rating)}
            </p>
          )}
        </div>

        {/* What did you enjoy? */}
        <div style={{ marginBottom: "24px" }}>
          <label
            htmlFor="enjoyed"
            style={{
              display: "block",
              fontWeight: 500,
              color: "#374151",
              marginBottom: "8px",
            }}
          >
            What did you enjoy about this event?
          </label>
          <textarea
            id="enjoyed"
            value={enjoyedText}
            onChange={(e) => setEnjoyedText(e.target.value)}
            placeholder="Tell us what you liked..."
            data-test-id="feedback-enjoyed"
            style={{
              width: "100%",
              minHeight: "100px",
              padding: "12px",
              fontSize: "16px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* What could be improved? */}
        <div style={{ marginBottom: "24px" }}>
          <label
            htmlFor="improved"
            style={{
              display: "block",
              fontWeight: 500,
              color: "#374151",
              marginBottom: "8px",
            }}
          >
            What could be improved?
          </label>
          <textarea
            id="improved"
            value={improvedText}
            onChange={(e) => setImprovedText(e.target.value)}
            placeholder="Share your suggestions..."
            data-test-id="feedback-improved"
            style={{
              width: "100%",
              minHeight: "100px",
              padding: "12px",
              fontSize: "16px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Would you attend again? */}
        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              display: "block",
              fontWeight: 500,
              color: "#374151",
              marginBottom: "12px",
            }}
          >
            Would you attend a similar event again?
          </label>
          <div style={{ display: "flex", gap: "16px" }}>
            <button
              type="button"
              onClick={() => setAttendAgain(true)}
              data-test-id="attend-again-yes"
              style={{
                flex: 1,
                padding: "12px 24px",
                fontSize: "16px",
                fontWeight: 500,
                border: "2px solid",
                borderColor: attendAgain === true ? "#2563eb" : "#d1d5db",
                backgroundColor: attendAgain === true ? "#eff6ff" : "white",
                color: attendAgain === true ? "#2563eb" : "#374151",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setAttendAgain(false)}
              data-test-id="attend-again-no"
              style={{
                flex: 1,
                padding: "12px 24px",
                fontSize: "16px",
                fontWeight: 500,
                border: "2px solid",
                borderColor: attendAgain === false ? "#2563eb" : "#d1d5db",
                backgroundColor: attendAgain === false ? "#eff6ff" : "white",
                color: attendAgain === false ? "#2563eb" : "#374151",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              No
            </button>
          </div>
        </div>

        {/* Anonymous Option */}
        <div
          style={{
            marginBottom: "32px",
            padding: "16px",
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              data-test-id="feedback-anonymous"
              style={{
                width: "20px",
                height: "20px",
                marginTop: "2px",
                cursor: "pointer",
              }}
            />
            <div>
              <span
                style={{
                  display: "block",
                  fontWeight: 500,
                  color: "#374151",
                }}
              >
                Submit anonymously
              </span>
              <span style={{ fontSize: "14px", color: "#6b7280" }}>
                Your name will not be associated with this feedback
              </span>
            </div>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || rating === 0}
          data-test-id="feedback-submit"
          style={{
            width: "100%",
            padding: "14px 24px",
            fontSize: "16px",
            fontWeight: 600,
            color: "white",
            backgroundColor:
              isSubmitting || rating === 0 ? "#93c5fd" : "#2563eb",
            border: "none",
            borderRadius: "8px",
            cursor: isSubmitting || rating === 0 ? "not-allowed" : "pointer",
            transition: "background-color 0.2s",
          }}
        >
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </button>

        {rating === 0 && (
          <p
            style={{
              textAlign: "center",
              marginTop: "12px",
              fontSize: "14px",
              color: "#9ca3af",
            }}
          >
            Please select a rating to submit your feedback
          </p>
        )}
      </form>
    </div>
  );
}
