"use client";

import { useState } from "react";

/**
 * Membership Application Demo Page
 *
 * DEMO ONLY - No real submission, no DB writes
 *
 * Multi-step application flow:
 * 1. Welcome & Tier Selection (Newbie vs Full)
 * 2. Personal Information
 * 3. About You (interests, referral)
 * 4. Review & Submit
 * 5. Success Confirmation
 */

type MembershipTier = "newbie" | "full" | null;

interface FormData {
  tier: MembershipTier;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zip: string;
  howHeard: string;
  interests: string[];
  agreeToTerms: boolean;
}

const INITIAL_FORM_DATA: FormData = {
  tier: null,
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  zip: "",
  howHeard: "",
  interests: [],
  agreeToTerms: false,
};

const INTEREST_OPTIONS = [
  "Dining Out",
  "Wine Tasting",
  "Hiking & Nature",
  "Golf",
  "Book Club",
  "Art & Culture",
  "Garden Club",
  "Social Events",
  "Travel",
  "Music & Concerts",
];

const HOW_HEARD_OPTIONS = [
  "Friend or Family",
  "Neighbor",
  "Community Event",
  "Social Media",
  "Google Search",
  "Local Newspaper",
  "Other",
];

export default function JoinPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 5;

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleMockSubmit = async () => {
    setIsSubmitting(true);
    // Simulate network delay for premium feel
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    nextStep();
  };

  return (
    <div data-theme="sbnc" className="min-h-screen bg-[var(--token-color-background)]">
      {/* Header */}
      <header className="bg-[var(--token-color-surface)] border-b border-[var(--token-color-border)] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--token-color-primary)] flex items-center justify-center">
              <span className="text-white font-bold text-lg">SB</span>
            </div>
            <div>
              <h1 className="font-semibold text-[var(--token-color-text)]">
                Santa Barbara Newcomers Club
              </h1>
              <p className="text-sm text-[var(--token-color-text-muted)]">
                Making friends since 1962
              </p>
            </div>
          </div>
          <DemoBadge />
        </div>
      </header>

      {/* Progress Bar */}
      {step < 5 && (
        <div className="bg-[var(--token-color-surface)] border-b border-[var(--token-color-border)]">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[var(--token-color-text)]">
                Step {step} of 4
              </span>
              <span className="text-sm text-[var(--token-color-text-muted)]">
                {getStepLabel(step)}
              </span>
            </div>
            <div className="h-2 bg-[var(--token-color-surface-2)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--token-color-primary)] transition-all duration-500 ease-out"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {step === 1 && (
          <StepTierSelection
            selectedTier={formData.tier}
            onSelect={(tier) => updateFormData({ tier })}
            onNext={nextStep}
          />
        )}
        {step === 2 && (
          <StepPersonalInfo
            formData={formData}
            updateFormData={updateFormData}
            onNext={nextStep}
            onBack={prevStep}
          />
        )}
        {step === 3 && (
          <StepAboutYou
            formData={formData}
            updateFormData={updateFormData}
            onNext={nextStep}
            onBack={prevStep}
          />
        )}
        {step === 4 && (
          <StepReview
            formData={formData}
            onSubmit={handleMockSubmit}
            onBack={prevStep}
            isSubmitting={isSubmitting}
          />
        )}
        {step === 5 && <StepSuccess formData={formData} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--token-color-border)] bg-[var(--token-color-surface)] mt-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 text-center text-sm text-[var(--token-color-text-muted)]">
          <p>Questions? Email us at membership@sbnewcomers.org</p>
          <p className="mt-2">
            This is a demo application. No data is saved or submitted.
          </p>
        </div>
      </footer>
    </div>
  );
}

function getStepLabel(step: number): string {
  switch (step) {
    case 1:
      return "Choose Membership";
    case 2:
      return "Personal Information";
    case 3:
      return "About You";
    case 4:
      return "Review & Submit";
    default:
      return "";
  }
}

function DemoBadge() {
  return (
    <div className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium border border-amber-200">
      Demo Mode
    </div>
  );
}

// ============================================================================
// Step 1: Tier Selection
// ============================================================================

function StepTierSelection({
  selectedTier,
  onSelect,
  onNext,
}: {
  selectedTier: MembershipTier;
  onSelect: (tier: MembershipTier) => void;
  onNext: () => void;
}) {
  return (
    <div className="animate-fadeIn">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-[var(--token-color-text)] mb-3">
          Welcome to Santa Barbara Newcomers!
        </h2>
        <p className="text-lg text-[var(--token-color-text-muted)] max-w-2xl mx-auto">
          Join hundreds of friendly locals and transplants who love exploring
          everything Santa Barbara has to offer. Choose the membership that fits
          your journey.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Newbie Membership */}
        <TierCard
          title="Newbie Membership"
          subtitle="Perfect for your first year"
          price="$45"
          period="/first year"
          isSelected={selectedTier === "newbie"}
          isPopular
          onSelect={() => onSelect("newbie")}
          features={[
            "Full access to all events and activities",
            "Welcome orientation & newcomer mixers",
            "Dedicated mentor to help you connect",
            "Members-only online directory",
            "Monthly e-newsletter",
            "Discounted rates renewing as Full Member",
          ]}
          highlightText="Most new members start here"
        />

        {/* Full Membership */}
        <TierCard
          title="Full Membership"
          subtitle="For returning or established members"
          price="$60"
          period="/year"
          isSelected={selectedTier === "full"}
          onSelect={() => onSelect("full")}
          features={[
            "Full access to all events and activities",
            "Vote in club elections",
            "Eligible for committee leadership",
            "Members-only online directory",
            "Monthly e-newsletter",
            "Support the club's community programs",
          ]}
        />
      </div>

      <div className="flex justify-center mt-10">
        <button
          onClick={onNext}
          disabled={!selectedTier}
          className="px-8 py-3 bg-[var(--token-color-primary)] text-white font-semibold rounded-lg
                     hover:bg-[var(--token-color-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 shadow-md hover:shadow-lg"
        >
          Continue with {selectedTier === "newbie" ? "Newbie" : selectedTier === "full" ? "Full" : "..."} Membership
        </button>
      </div>

      <p className="text-center text-sm text-[var(--token-color-text-muted)] mt-6">
        Not sure which to choose?{" "}
        <button className="text-[var(--token-color-primary)] underline hover:no-underline">
          Learn more about membership tiers
        </button>
      </p>
    </div>
  );
}

function TierCard({
  title,
  subtitle,
  price,
  period,
  isSelected,
  isPopular,
  onSelect,
  features,
  highlightText,
}: {
  title: string;
  subtitle: string;
  price: string;
  period: string;
  isSelected: boolean;
  isPopular?: boolean;
  onSelect: () => void;
  features: string[];
  highlightText?: string;
}) {
  return (
    <div
      onClick={onSelect}
      className={`
        relative cursor-pointer rounded-xl border-2 p-6 transition-all duration-200
        ${
          isSelected
            ? "border-[var(--token-color-primary)] bg-[var(--token-color-surface)] shadow-lg scale-[1.02]"
            : "border-[var(--token-color-border)] bg-[var(--token-color-surface)] hover:border-[var(--token-color-primary)] hover:shadow-md"
        }
      `}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 bg-[var(--token-color-primary)] text-white text-xs font-semibold rounded-full">
            Most Popular
          </span>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-[var(--token-color-text)]">{title}</h3>
          <p className="text-sm text-[var(--token-color-text-muted)]">{subtitle}</p>
        </div>
        <div
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
            ${isSelected ? "border-[var(--token-color-primary)] bg-[var(--token-color-primary)]" : "border-[var(--token-color-border)]"}
          `}
        >
          {isSelected && (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>

      <div className="mb-6">
        <span className="text-4xl font-bold text-[var(--token-color-text)]">{price}</span>
        <span className="text-[var(--token-color-text-muted)]">{period}</span>
      </div>

      {highlightText && (
        <p className="text-sm text-[var(--token-color-primary)] font-medium mb-4 bg-[var(--token-color-surface-2)] px-3 py-2 rounded-lg">
          {highlightText}
        </p>
      )}

      <ul className="space-y-3">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-[var(--token-color-text)]">
            <svg
              className="w-5 h-5 text-[var(--token-color-success)] flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// Step 2: Personal Information
// ============================================================================

function StepPersonalInfo({
  formData,
  updateFormData,
  onNext,
  onBack,
}: {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const isValid =
    formData.firstName.trim() &&
    formData.lastName.trim() &&
    formData.email.trim() &&
    formData.email.includes("@");

  return (
    <div className="animate-fadeIn max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[var(--token-color-text)] mb-2">
          Tell us about yourself
        </h2>
        <p className="text-[var(--token-color-text-muted)]">
          We&apos;ll use this information to set up your membership.
        </p>
      </div>

      <div className="bg-[var(--token-color-surface)] rounded-xl border border-[var(--token-color-border)] p-6 shadow-sm">
        <div className="grid gap-5">
          <div className="grid md:grid-cols-2 gap-4">
            <FormField
              label="First Name"
              required
              value={formData.firstName}
              onChange={(v) => updateFormData({ firstName: v })}
              placeholder="Jane"
            />
            <FormField
              label="Last Name"
              required
              value={formData.lastName}
              onChange={(v) => updateFormData({ lastName: v })}
              placeholder="Smith"
            />
          </div>

          <FormField
            label="Email Address"
            type="email"
            required
            value={formData.email}
            onChange={(v) => updateFormData({ email: v })}
            placeholder="jane@example.com"
            helpText="We'll send your membership confirmation here"
          />

          <FormField
            label="Phone Number"
            type="tel"
            value={formData.phone}
            onChange={(v) => updateFormData({ phone: v })}
            placeholder="(805) 555-1234"
            helpText="Optional - for event reminders"
          />

          <div className="border-t border-[var(--token-color-border)] pt-5 mt-2">
            <h3 className="font-medium text-[var(--token-color-text)] mb-4">
              Mailing Address
            </h3>
            <div className="grid gap-4">
              <FormField
                label="Street Address"
                value={formData.address}
                onChange={(v) => updateFormData({ address: v })}
                placeholder="123 Main St"
              />
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  label="City"
                  value={formData.city}
                  onChange={(v) => updateFormData({ city: v })}
                  placeholder="Santa Barbara"
                />
                <FormField
                  label="ZIP Code"
                  value={formData.zip}
                  onChange={(v) => updateFormData({ zip: v })}
                  placeholder="93101"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <NavigationButtons
        onBack={onBack}
        onNext={onNext}
        nextDisabled={!isValid}
        nextLabel="Continue"
      />
    </div>
  );
}

// ============================================================================
// Step 3: About You
// ============================================================================

function StepAboutYou({
  formData,
  updateFormData,
  onNext,
  onBack,
}: {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const toggleInterest = (interest: string) => {
    const current = formData.interests;
    if (current.includes(interest)) {
      updateFormData({ interests: current.filter((i) => i !== interest) });
    } else {
      updateFormData({ interests: [...current, interest] });
    }
  };

  return (
    <div className="animate-fadeIn max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[var(--token-color-text)] mb-2">
          Help us connect you
        </h2>
        <p className="text-[var(--token-color-text-muted)]">
          This helps us match you with activities and members who share your interests.
        </p>
      </div>

      <div className="bg-[var(--token-color-surface)] rounded-xl border border-[var(--token-color-border)] p-6 shadow-sm">
        <div className="space-y-6">
          {/* How did you hear about us */}
          <div>
            <label className="block text-sm font-medium text-[var(--token-color-text)] mb-2">
              How did you hear about us?
            </label>
            <select
              value={formData.howHeard}
              onChange={(e) => updateFormData({ howHeard: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-[var(--token-color-border)] bg-[var(--token-color-surface)]
                         text-[var(--token-color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--token-color-primary)] focus:border-transparent"
            >
              <option value="">Select an option...</option>
              {HOW_HEARD_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm font-medium text-[var(--token-color-text)] mb-2">
              What activities interest you? <span className="text-[var(--token-color-text-muted)] font-normal">(Select all that apply)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {INTEREST_OPTIONS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`
                    px-4 py-2.5 rounded-lg border text-sm font-medium transition-all text-left
                    ${
                      formData.interests.includes(interest)
                        ? "border-[var(--token-color-primary)] bg-[var(--token-color-primary)] text-white"
                        : "border-[var(--token-color-border)] bg-[var(--token-color-surface)] text-[var(--token-color-text)] hover:border-[var(--token-color-primary)]"
                    }
                  `}
                >
                  {interest}
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--token-color-text-muted)] mt-2">
              You can update these anytime in your member profile
            </p>
          </div>
        </div>
      </div>

      <NavigationButtons onBack={onBack} onNext={onNext} nextLabel="Review Application" />
    </div>
  );
}

// ============================================================================
// Step 4: Review & Submit
// ============================================================================

function StepReview({
  formData,
  onSubmit,
  onBack,
  isSubmitting,
}: {
  formData: FormData;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}) {
  const [agreed, setAgreed] = useState(false);

  const tierLabel = formData.tier === "newbie" ? "Newbie Membership" : "Full Membership";
  const tierPrice = formData.tier === "newbie" ? "$45" : "$60";

  return (
    <div className="animate-fadeIn max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[var(--token-color-text)] mb-2">
          Review your application
        </h2>
        <p className="text-[var(--token-color-text-muted)]">
          Please confirm everything looks correct before submitting.
        </p>
      </div>

      <div className="space-y-4">
        {/* Membership Summary */}
        <div className="bg-[var(--token-color-surface)] rounded-xl border border-[var(--token-color-border)] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--token-color-border)]">
            <div>
              <h3 className="font-semibold text-[var(--token-color-text)]">{tierLabel}</h3>
              <p className="text-sm text-[var(--token-color-text-muted)]">Annual membership</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-[var(--token-color-text)]">{tierPrice}</span>
              <p className="text-xs text-[var(--token-color-text-muted)]">Due today</p>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <ReviewRow label="Name" value={`${formData.firstName} ${formData.lastName}`} />
            <ReviewRow label="Email" value={formData.email} />
            {formData.phone && <ReviewRow label="Phone" value={formData.phone} />}
            {formData.city && (
              <ReviewRow
                label="Location"
                value={`${formData.city}${formData.zip ? `, ${formData.zip}` : ""}`}
              />
            )}
            {formData.interests.length > 0 && (
              <ReviewRow label="Interests" value={formData.interests.join(", ")} />
            )}
            {formData.howHeard && <ReviewRow label="Referred by" value={formData.howHeard} />}
          </div>
        </div>

        {/* Terms Agreement */}
        <div className="bg-[var(--token-color-surface-2)] rounded-xl p-5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded border-[var(--token-color-border)] text-[var(--token-color-primary)] focus:ring-[var(--token-color-primary)]"
            />
            <span className="text-sm text-[var(--token-color-text)]">
              I agree to the{" "}
              <button className="text-[var(--token-color-primary)] underline hover:no-underline">
                membership terms
              </button>{" "}
              and{" "}
              <button className="text-[var(--token-color-primary)] underline hover:no-underline">
                code of conduct
              </button>
              . I understand my membership will begin immediately upon payment.
            </span>
          </label>
        </div>

        {/* Demo Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-amber-800">
              <strong>Demo Mode:</strong> This is a demonstration. Clicking &quot;Submit Application&quot; will
              show the confirmation screen but will not process any payment or create a real membership.
            </div>
          </div>
        </div>
      </div>

      <NavigationButtons
        onBack={onBack}
        onNext={onSubmit}
        nextLabel={isSubmitting ? "Submitting..." : "Submit Application"}
        nextDisabled={!agreed || isSubmitting}
      />
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-[var(--token-color-text-muted)]">{label}</span>
      <span className="text-[var(--token-color-text)] font-medium">{value}</span>
    </div>
  );
}

// ============================================================================
// Step 5: Success
// ============================================================================

function StepSuccess({ formData }: { formData: FormData }) {
  const tierLabel = formData.tier === "newbie" ? "Newbie" : "Full";

  return (
    <div className="animate-fadeIn max-w-xl mx-auto text-center">
      {/* Success Icon */}
      <div className="mb-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-[var(--token-color-success)] flex items-center justify-center animate-scaleIn">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <h2 className="text-3xl font-bold text-[var(--token-color-text)] mb-3">
        Welcome to the club, {formData.firstName}!
      </h2>
      <p className="text-lg text-[var(--token-color-text-muted)] mb-8">
        Your {tierLabel} Membership application has been received.
      </p>

      {/* What's Next Card */}
      <div className="bg-[var(--token-color-surface)] rounded-xl border border-[var(--token-color-border)] p-6 shadow-sm text-left mb-8">
        <h3 className="font-semibold text-[var(--token-color-text)] mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--token-color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          What happens next
        </h3>
        <ul className="space-y-4">
          <NextStep
            number={1}
            title="Check your email"
            description="We've sent a confirmation to your email with your membership details and login instructions."
          />
          <NextStep
            number={2}
            title="Complete your profile"
            description="Log in to add a photo and tell us more about yourself so other members can get to know you."
          />
          <NextStep
            number={3}
            title="Browse upcoming events"
            description="Check out this month's activities and RSVP to events that interest you."
          />
          {formData.tier === "newbie" && (
            <NextStep
              number={4}
              title="Meet your mentor"
              description="A friendly member will reach out to welcome you and answer any questions."
            />
          )}
        </ul>
      </div>

      {/* Quick Links */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button className="px-6 py-3 bg-[var(--token-color-primary)] text-white font-semibold rounded-lg hover:bg-[var(--token-color-primary-hover)] transition-colors">
          Browse Upcoming Events
        </button>
        <button className="px-6 py-3 border border-[var(--token-color-border)] text-[var(--token-color-text)] font-semibold rounded-lg hover:bg-[var(--token-color-surface-2)] transition-colors">
          Complete My Profile
        </button>
      </div>

      {/* Demo Reset */}
      <div className="mt-10 pt-6 border-t border-[var(--token-color-border)]">
        <p className="text-sm text-[var(--token-color-text-muted)] mb-3">
          This was a demo. No membership was actually created.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-[var(--token-color-primary)] font-medium hover:underline"
        >
          Start demo again
        </button>
      </div>
    </div>
  );
}

function NextStep({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <li className="flex gap-4">
      <div className="w-8 h-8 rounded-full bg-[var(--token-color-surface-2)] flex items-center justify-center flex-shrink-0 font-semibold text-[var(--token-color-text)]">
        {number}
      </div>
      <div>
        <h4 className="font-medium text-[var(--token-color-text)]">{title}</h4>
        <p className="text-sm text-[var(--token-color-text-muted)]">{description}</p>
      </div>
    </li>
  );
}

// ============================================================================
// Shared Components
// ============================================================================

function FormField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  helpText,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--token-color-text)] mb-1.5">
        {label}
        {required && <span className="text-[var(--token-color-danger)] ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-lg border border-[var(--token-color-border)] bg-[var(--token-color-surface)]
                   text-[var(--token-color-text)] placeholder:text-[var(--token-color-text-muted)]
                   focus:outline-none focus:ring-2 focus:ring-[var(--token-color-primary)] focus:border-transparent
                   transition-all"
      />
      {helpText && (
        <p className="text-xs text-[var(--token-color-text-muted)] mt-1.5">{helpText}</p>
      )}
    </div>
  );
}

function NavigationButtons({
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled = false,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="flex justify-between items-center mt-8">
      {onBack ? (
        <button
          onClick={onBack}
          className="px-6 py-2.5 text-[var(--token-color-text-muted)] hover:text-[var(--token-color-text)] font-medium transition-colors"
        >
          Back
        </button>
      ) : (
        <div />
      )}
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className="px-8 py-3 bg-[var(--token-color-primary)] text-white font-semibold rounded-lg
                   hover:bg-[var(--token-color-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200 shadow-md hover:shadow-lg"
      >
        {nextLabel}
      </button>
    </div>
  );
}
