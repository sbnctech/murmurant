"use client";

import { useState } from "react";
import Link from "next/link";

const boardMembers = [
  { role: "President", email: "president@example.org" },
  { role: "VP Membership", email: "membership@example.org" },
  { role: "VP Activities", email: "activities@example.org" },
  { role: "Treasurer", email: "treasurer@example.org" },
  { role: "Secretary", email: "secretary@example.org" },
];

const faqs = [
  { question: "How do I become a member?", link: "/join" },
  { question: "How do I register for events?", link: "/events" },
  { question: "How do I update my profile?", link: "/my/profile" },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px" }}>
      <header style={{ textAlign: "center", marginBottom: 48 }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, color: "#1f2937", marginBottom: 12 }}>Contact Us</h1>
        <p style={{ fontSize: 18, color: "#6b7280" }}>We&apos;d love to hear from you</p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 40 }}>
        <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#1f2937", marginBottom: 24 }}>Send Us a Message</h2>
          {submitted ? (
            <div style={{ padding: 24, backgroundColor: "#ecfdf5", borderRadius: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#065f46", marginBottom: 4 }}>Message Sent!</div>
              <div style={{ fontSize: 14, color: "#047857" }}>We&apos;ll get back to you within 2-3 business days.</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Your Name</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: "100%", padding: "12px 16px", fontSize: 16, border: "1px solid #d1d5db", borderRadius: 8, boxSizing: "border-box" }} placeholder="Jane Smith" />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Email</label>
                <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={{ width: "100%", padding: "12px 16px", fontSize: 16, border: "1px solid #d1d5db", borderRadius: 8, boxSizing: "border-box" }} placeholder="jane@example.com" />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Message</label>
                <textarea required rows={5} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} style={{ width: "100%", padding: "12px 16px", fontSize: 16, border: "1px solid #d1d5db", borderRadius: 8, boxSizing: "border-box", fontFamily: "inherit", resize: "vertical" }} placeholder="How can we help?" />
              </div>
              <button type="submit" disabled={submitting} style={{ width: "100%", padding: "14px 20px", fontSize: 16, fontWeight: 600, backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>{submitting ? "Sending..." : "Send Message"}</button>
            </form>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1f2937", marginBottom: 16 }}>Board of Directors</h3>
            {boardMembers.map((m) => (
              <div key={m.role} style={{ paddingBottom: 12, marginBottom: 12, borderBottom: "1px solid #f3f4f6" }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{m.role}</div>
                <a href={`mailto:${m.email}`} style={{ fontSize: 14, color: "#2563eb", textDecoration: "none" }}>{m.email}</a>
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1f2937", marginBottom: 8 }}>Mailing Address</h3>
            <address style={{ fontSize: 14, color: "#374151", fontStyle: "normal", lineHeight: 1.6 }}>
              Santa Barbara Newcomers Club<br />P.O. Box 30651<br />Santa Barbara, CA 93130
            </address>
          </div>

          <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1f2937", marginBottom: 8 }}>Office Hours</h3>
            <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6 }}>Volunteer-run. Messages answered within 2-3 business days.</p>
          </div>

          <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1f2937", marginBottom: 12 }}>FAQs</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {faqs.map((f) => (
                <li key={f.question} style={{ marginBottom: 8 }}>
                  <Link href={f.link} style={{ fontSize: 14, color: "#2563eb", textDecoration: "none" }}>{f.question}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
