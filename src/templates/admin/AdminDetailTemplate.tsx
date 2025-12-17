import { ReactNode } from "react";
import PageHeader from "../../components/layout/PageHeader";
import SectionCard from "../../components/layout/SectionCard";

/**
 * AdminDetailTemplate - Detail/edit page template for admin
 *
 * Standard layout for admin detail pages featuring:
 * - Page header with title and action buttons
 * - Section cards for organizing content
 * - Two-column layout option for metadata
 *
 * Props:
 * - title: Page title (e.g., member name)
 * - subtitle: Optional subtitle (e.g., member status)
 * - headerActions: Action buttons (Edit, Delete, etc.)
 * - sections: Array of section configurations
 * - sidebar: Optional sidebar content
 * - children: Alternative to sections prop
 */

type SectionConfig = {
  title?: string;
  subtitle?: string;
  content: ReactNode;
  testId?: string;
};

type AdminDetailTemplateProps = {
  title: string;
  subtitle?: string;
  headerActions?: ReactNode;
  sections?: SectionConfig[];
  sidebar?: ReactNode;
  children?: ReactNode;
  breadcrumb?: ReactNode;
};

export default function AdminDetailTemplate({
  title,
  subtitle,
  headerActions,
  sections,
  sidebar,
  children,
  breadcrumb,
}: AdminDetailTemplateProps) {
  const hasSidebar = Boolean(sidebar);

  return (
    <div data-test-id="admin-detail-template">
      {/* Page Header */}
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={headerActions}
        breadcrumb={breadcrumb}
        testId="admin-detail-header"
      />

      {/* Content area */}
      <div
        style={{
          display: hasSidebar ? "grid" : "block",
          gridTemplateColumns: hasSidebar ? "1fr 320px" : undefined,
          gap: "var(--token-space-lg)",
          alignItems: "start",
        }}
      >
        {/* Main content */}
        <div data-test-id="admin-detail-main">
          {/* Render sections if provided */}
          {sections && sections.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--token-space-lg)",
              }}
            >
              {sections.map((section, index) => (
                <SectionCard
                  key={section.testId || index}
                  title={section.title}
                  subtitle={section.subtitle}
                  testId={section.testId || `admin-detail-section-${index}`}
                >
                  {section.content}
                </SectionCard>
              ))}
            </div>
          )}

          {/* Render children if no sections */}
          {!sections && children}
        </div>

        {/* Sidebar */}
        {hasSidebar && (
          <aside
            data-test-id="admin-detail-sidebar"
            style={{
              position: "sticky",
              top: "calc(var(--token-layout-nav-height) + var(--token-space-lg))",
            }}
          >
            {sidebar}
          </aside>
        )}
      </div>
    </div>
  );
}
