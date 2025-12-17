import { ReactNode } from "react";

/**
 * MemberHomeTemplate - Hero-style home page template
 *
 * Designed for the member-facing home/landing page with:
 * - Hero section with title and description
 * - Feature cards section
 * - Primary CTA area
 *
 * Props:
 * - heroTitle: Main hero heading
 * - heroDescription: Hero subtext
 * - heroActions: CTA buttons in hero
 * - featureCards: Array of feature card content
 * - children: Additional content below features
 */

type FeatureCard = {
  title: string;
  description: string;
  icon?: ReactNode;
  href?: string;
  testId?: string;
};

type MemberHomeTemplateProps = {
  heroTitle: string;
  heroDescription?: string;
  heroActions?: ReactNode;
  featureCards?: FeatureCard[];
  children?: ReactNode;
};

export default function MemberHomeTemplate({
  heroTitle,
  heroDescription,
  heroActions,
  featureCards = [],
  children,
}: MemberHomeTemplateProps) {
  return (
    <div data-test-id="member-home-template">
      {/* ========================================
          HERO SECTION
          ======================================== */}
      <section
        data-test-id="member-home-hero"
        style={{
          textAlign: "center",
          padding: "var(--token-space-2xl) var(--token-space-md)",
          marginBottom: "var(--token-space-2xl)",
        }}
      >
        <h1
          data-test-id="member-home-hero-title"
          style={{
            fontSize: "var(--token-text-3xl)",
            fontWeight: "var(--token-weight-bold)",
            color: "var(--token-color-text)",
            margin: 0,
            lineHeight: "var(--token-leading-tight)",
          }}
        >
          {heroTitle}
        </h1>

        {heroDescription && (
          <p
            data-test-id="member-home-hero-description"
            style={{
              fontSize: "var(--token-text-lg)",
              color: "var(--token-color-text-muted)",
              marginTop: "var(--token-space-md)",
              marginBottom: 0,
              maxWidth: "var(--token-layout-content-max-width)",
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: "var(--token-leading-relaxed)",
            }}
          >
            {heroDescription}
          </p>
        )}

        {heroActions && (
          <div
            data-test-id="member-home-hero-actions"
            style={{
              marginTop: "var(--token-space-xl)",
              display: "flex",
              justifyContent: "center",
              gap: "var(--token-space-md)",
              flexWrap: "wrap",
            }}
          >
            {heroActions}
          </div>
        )}
      </section>

      {/* ========================================
          FEATURE CARDS SECTION
          ======================================== */}
      {featureCards.length > 0 && (
        <section
          data-test-id="member-home-features"
          style={{
            marginBottom: "var(--token-space-2xl)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "var(--token-space-lg)",
            }}
          >
            {featureCards.map((card, index) => (
              <FeatureCardComponent
                key={card.testId || index}
                {...card}
                testId={card.testId || `feature-card-${index}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* ========================================
          ADDITIONAL CONTENT
          ======================================== */}
      {children && (
        <section data-test-id="member-home-content">{children}</section>
      )}
    </div>
  );
}

/**
 * Feature Card Component
 */
function FeatureCardComponent({
  title,
  description,
  icon,
  href,
  testId,
}: FeatureCard) {
  const cardContent = (
    <>
      {icon && (
        <div
          style={{
            marginBottom: "var(--token-space-md)",
            color: "var(--token-color-primary)",
          }}
        >
          {icon}
        </div>
      )}
      <h3
        style={{
          fontSize: "var(--token-text-lg)",
          fontWeight: "var(--token-weight-semibold)",
          color: "var(--token-color-text)",
          margin: 0,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: "var(--token-text-base)",
          color: "var(--token-color-text-muted)",
          marginTop: "var(--token-space-sm)",
          marginBottom: 0,
          lineHeight: "var(--token-leading-normal)",
        }}
      >
        {description}
      </p>
    </>
  );

  const cardStyle: React.CSSProperties = {
    backgroundColor: "var(--token-color-surface)",
    border: "1px solid var(--token-color-border)",
    borderRadius: "var(--token-radius-lg)",
    padding: "var(--token-space-lg)",
    textDecoration: "none",
    display: "block",
    transition: "box-shadow 0.15s ease, border-color 0.15s ease",
  };

  if (href) {
    return (
      <a href={href} data-test-id={testId} style={cardStyle}>
        {cardContent}
      </a>
    );
  }

  return (
    <div data-test-id={testId} style={cardStyle}>
      {cardContent}
    </div>
  );
}
