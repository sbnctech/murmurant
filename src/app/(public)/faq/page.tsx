"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

/**
 * FAQ Page
 *
 * Public FAQ page with accordion-style sections, search, and contact link.
 *
 * Charter: P6 (Human-first UI language)
 */

type FAQItem = {
  id: string;
  question: string;
  answer: string;
  category: FAQCategory;
};

type FAQCategory = "membership" | "events" | "payments" | "general";

const CATEGORY_LABELS: Record<FAQCategory, string> = {
  membership: "Membership",
  events: "Events & Activities",
  payments: "Payments & Billing",
  general: "General",
};

const CATEGORY_ICONS: Record<FAQCategory, string> = {
  membership: "👥",
  events: "📅",
  payments: "💳",
  general: "❓",
};

const FAQ_DATA: FAQItem[] = [
  // Membership FAQs (5)
  {
    id: "m1",
    category: "membership",
    question: "Who can join Santa Barbara Newcomers Club?",
    answer:
      "Anyone who has moved to Santa Barbara within the last few years is welcome to join as a Newcomer member. If you have been here longer, you can join as a Full Member. We welcome all ages and backgrounds!",
  },
  {
    id: "m2",
    category: "membership",
    question: "What is the difference between Newbie and Full membership?",
    answer:
      "Newbie membership ($45/year) is designed for those new to the area and includes a welcome orientation, dedicated mentor, and newcomer-specific events. Full membership ($60/year) is for established residents and includes voting rights and eligibility for committee leadership. Both tiers have full access to all events and activities.",
  },
  {
    id: "m3",
    category: "membership",
    question: "How long does it take to become a member?",
    answer:
      "Most applications are processed within 1-2 business days. Once approved, you will receive a welcome email with login instructions and can immediately start registering for events.",
  },
  {
    id: "m4",
    category: "membership",
    question: "Can I bring guests to events?",
    answer:
      "Yes! Members can bring guests to most events. Some popular events may have member-only registration periods or guest limits. Check each event's details for specific guest policies.",
  },
  {
    id: "m5",
    category: "membership",
    question: "How do I cancel or pause my membership?",
    answer:
      "You can cancel anytime by contacting membership@sbnewcomers.org. Memberships are non-refundable but valid through the end of your membership period. We do not currently offer pause options, but you are welcome to rejoin anytime.",
  },

  // Events FAQs (5)
  {
    id: "e1",
    category: "events",
    question: "How do I sign up for events?",
    answer:
      "Log in to your member account, browse upcoming events, and click Register on any event that interests you. You will receive a confirmation email with all the details.",
  },
  {
    id: "e2",
    category: "events",
    question: "What if an event is full?",
    answer:
      "You can join the waitlist for any full event. If a spot opens up, you will be notified automatically. Waitlist members are contacted in order of signup.",
  },
  {
    id: "e3",
    category: "events",
    question: "How do I cancel my event registration?",
    answer:
      "Log in to your account, go to My Events, and click Cancel Registration. Please cancel at least 48 hours in advance when possible so we can offer your spot to waitlisted members.",
  },
  {
    id: "e4",
    category: "events",
    question: "Can I suggest a new activity or interest group?",
    answer:
      "Absolutely! We love member-driven activities. Contact our Activities Chair at activities@sbnewcomers.org with your idea. If there is enough interest, we can help you start a new group.",
  },
  {
    id: "e5",
    category: "events",
    question: "What types of events does the club offer?",
    answer:
      "We offer a wide variety: dining out, wine tasting, hiking, golf, book clubs, cultural outings, travel, game nights, and more. Check our calendar for the full range of monthly activities.",
  },

  // Payments FAQs (5)
  {
    id: "p1",
    category: "payments",
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, MasterCard, American Express, Discover) through our secure payment system. We do not accept cash or checks for online transactions.",
  },
  {
    id: "p2",
    category: "payments",
    question: "Is my payment information secure?",
    answer:
      "Yes. We use industry-standard encryption and never store your full credit card number. All payments are processed through PCI-compliant payment processors.",
  },
  {
    id: "p3",
    category: "payments",
    question: "Can I get a refund for an event I cannot attend?",
    answer:
      "Refund policies vary by event. Most events offer full refunds if you cancel 48+ hours in advance. Last-minute cancellations may not be refundable. Check each event's cancellation policy.",
  },
  {
    id: "p4",
    category: "payments",
    question: "When does my membership renew?",
    answer:
      "Memberships are valid for one year from your join date. You will receive renewal reminders starting 30 days before expiration. Renewal is not automatic. You will need to log in and renew.",
  },
  {
    id: "p5",
    category: "payments",
    question: "Are membership dues tax-deductible?",
    answer:
      "Santa Barbara Newcomers Club is a 501(c)(7) social club, so membership dues are generally not tax-deductible as charitable contributions. Consult your tax advisor for specific guidance.",
  },

  // General FAQs (5)
  {
    id: "g1",
    category: "general",
    question: "How do I update my contact information?",
    answer:
      "Log in to your account and go to My Profile to update your email, phone, address, or other details. Changes take effect immediately.",
  },
  {
    id: "g2",
    category: "general",
    question: "I forgot my password. How do I reset it?",
    answer:
      "Click Forgot Password on the login page and enter your email. You will receive a reset link within a few minutes. Check your spam folder if you do not see it.",
  },
  {
    id: "g3",
    category: "general",
    question: "How can I volunteer or get more involved?",
    answer:
      "We are always looking for volunteers! Contact our Volunteer Coordinator at volunteer@sbnewcomers.org or indicate your interest in your member profile. Opportunities range from event hosting to committee leadership.",
  },
  {
    id: "g4",
    category: "general",
    question: "How do I contact the club with questions?",
    answer:
      "Email us at info@sbnewcomers.org for general inquiries. For membership questions, use membership@sbnewcomers.org. You can also reach out through the Contact page on our website.",
  },
  {
    id: "g5",
    category: "general",
    question: "Is there a mobile app?",
    answer:
      "Our website is fully mobile-responsive, so you can access all features from your phone browser. We do not currently have a dedicated mobile app, but it is on our roadmap.",
  },
];

function AccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-[var(--token-color-border)] last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 text-left hover:bg-[var(--token-color-surface-2)] transition-colors rounded-lg px-4"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-[var(--token-color-text)] pr-4">
          {item.question}
        </span>
        <span
          className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-[var(--token-color-surface-2)] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <svg
            className="w-4 h-4 text-[var(--token-color-text-muted)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? "max-h-96 pb-4" : "max-h-0"
        }`}
      >
        <p className="text-[var(--token-color-text-muted)] leading-relaxed px-4">
          {item.answer}
        </p>
      </div>
    </div>
  );
}

function CategorySection({
  category,
  items,
  openItems,
  onToggle,
}: {
  category: FAQCategory;
  items: FAQItem[];
  openItems: Set<string>;
  onToggle: (id: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-[var(--token-color-text)] mb-4 flex items-center gap-2">
        <span>{CATEGORY_ICONS[category]}</span>
        {CATEGORY_LABELS[category]}
      </h2>
      <div className="bg-[var(--token-color-surface)] rounded-xl border border-[var(--token-color-border)] divide-y divide-[var(--token-color-border)]">
        {items.map((item) => (
          <AccordionItem
            key={item.id}
            item={item}
            isOpen={openItems.has(item.id)}
            onToggle={() => onToggle(item.id)}
          />
        ))}
      </div>
    </section>
  );
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<FAQCategory | "all">("all");
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const filteredFAQs = useMemo(() => {
    let results = FAQ_DATA;

    // Filter by category
    if (activeCategory !== "all") {
      results = results.filter((faq) => faq.category === activeCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (faq) =>
          faq.question.toLowerCase().includes(query) ||
          faq.answer.toLowerCase().includes(query)
      );
    }

    return results;
  }, [searchQuery, activeCategory]);

  const groupedFAQs = useMemo(() => {
    const groups: Record<FAQCategory, FAQItem[]> = {
      membership: [],
      events: [],
      payments: [],
      general: [],
    };
    filteredFAQs.forEach((faq) => {
      groups[faq.category].push(faq);
    });
    return groups;
  }, [filteredFAQs]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setOpenItems(new Set(filteredFAQs.map((faq) => faq.id)));
  };

  const collapseAll = () => {
    setOpenItems(new Set());
  };

  const categories: Array<{ key: FAQCategory | "all"; label: string }> = [
    { key: "all", label: "All" },
    { key: "membership", label: "Membership" },
    { key: "events", label: "Events" },
    { key: "payments", label: "Payments" },
    { key: "general", label: "General" },
  ];

  return (
    <div className="min-h-screen bg-[var(--token-color-background)]">
      {/* Hero Section */}
      <header className="bg-[var(--token-color-surface)] border-b border-[var(--token-color-border)]">
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <h1 className="text-3xl font-bold text-[var(--token-color-text)] mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-[var(--token-color-text-muted)] max-w-2xl mx-auto">
            Find answers to common questions about membership, events, payments,
            and more.
          </p>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Search Box */}
        <div className="relative mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search FAQs..."
            className="w-full px-4 py-3 pl-12 rounded-xl border border-[var(--token-color-border)] bg-[var(--token-color-surface)]
                       text-[var(--token-color-text)] placeholder:text-[var(--token-color-text-muted)]
                       focus:outline-none focus:ring-2 focus:ring-[var(--token-color-primary)] focus:border-transparent"
          />
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--token-color-text-muted)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--token-color-text-muted)] hover:text-[var(--token-color-text)]"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat.key
                  ? "bg-[var(--token-color-primary)] text-white"
                  : "bg-[var(--token-color-surface)] text-[var(--token-color-text)] border border-[var(--token-color-border)] hover:border-[var(--token-color-primary)]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Expand/Collapse Controls */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-[var(--token-color-text-muted)]">
            {filteredFAQs.length} {filteredFAQs.length === 1 ? "result" : "results"}
          </p>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="text-sm text-[var(--token-color-primary)] hover:underline"
            >
              Expand all
            </button>
            <span className="text-[var(--token-color-text-muted)]">|</span>
            <button
              onClick={collapseAll}
              className="text-sm text-[var(--token-color-primary)] hover:underline"
            >
              Collapse all
            </button>
          </div>
        </div>
      </div>

      {/* FAQ Content */}
      <main className="max-w-4xl mx-auto px-6 pb-12">
        {filteredFAQs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[var(--token-color-text-muted)] mb-4">
              No FAQs match your search.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("all");
              }}
              className="text-[var(--token-color-primary)] hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : activeCategory === "all" ? (
          // Show grouped by category
          <>
            <CategorySection
              category="membership"
              items={groupedFAQs.membership}
              openItems={openItems}
              onToggle={toggleItem}
            />
            <CategorySection
              category="events"
              items={groupedFAQs.events}
              openItems={openItems}
              onToggle={toggleItem}
            />
            <CategorySection
              category="payments"
              items={groupedFAQs.payments}
              openItems={openItems}
              onToggle={toggleItem}
            />
            <CategorySection
              category="general"
              items={groupedFAQs.general}
              openItems={openItems}
              onToggle={toggleItem}
            />
          </>
        ) : (
          // Show single category
          <CategorySection
            category={activeCategory}
            items={filteredFAQs}
            openItems={openItems}
            onToggle={toggleItem}
          />
        )}

        {/* Contact Section */}
        <div className="mt-12 bg-[var(--token-color-surface-2)] rounded-xl p-8 text-center">
          <h2 className="text-xl font-semibold text-[var(--token-color-text)] mb-2">
            Still have questions?
          </h2>
          <p className="text-[var(--token-color-text-muted)] mb-6">
            Cannot find what you are looking for? We are here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="mailto:info@sbnewcomers.org"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--token-color-primary)] text-white font-semibold rounded-lg hover:bg-[var(--token-color-primary-hover)] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Email Us
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-[var(--token-color-border)] text-[var(--token-color-text)] font-semibold rounded-lg hover:bg-[var(--token-color-surface)] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              Contact Page
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--token-color-border)] bg-[var(--token-color-surface)]">
        <div className="max-w-4xl mx-auto px-6 py-6 text-center text-sm text-[var(--token-color-text-muted)]">
          <p>Santa Barbara Newcomers Club - Making friends since 1962</p>
        </div>
      </footer>
    </div>
  );
}
