import { ReactNode } from "react";

/**
 * DataTableFrame - Token-based container for data tables
 *
 * Provides consistent styling for tables including:
 * - Optional filter row
 * - Table container with horizontal scroll
 * - Pagination region
 *
 * Props:
 * - filters: Optional filter controls slot
 * - children: Table content
 * - pagination: Optional pagination controls
 * - emptyState: Content to show when table is empty
 * - loading: Loading state
 */

type DataTableFrameProps = {
  filters?: ReactNode;
  children: ReactNode;
  pagination?: ReactNode;
  emptyState?: ReactNode;
  loading?: boolean;
  testId?: string;
};

export default function DataTableFrame({
  filters,
  children,
  pagination,
  emptyState,
  loading = false,
  testId = "data-table-frame",
}: DataTableFrameProps) {
  return (
    <div data-test-id={testId}>
      {/* Filter row */}
      {filters && (
        <div
          data-test-id={`${testId}-filters`}
          style={{
            padding: "var(--token-space-md)",
            backgroundColor: "var(--token-color-surface-2)",
            borderRadius: "var(--token-radius-lg) var(--token-radius-lg) 0 0",
            borderBottom: "1px solid var(--token-color-border)",
            display: "flex",
            gap: "var(--token-space-md)",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {filters}
        </div>
      )}

      {/* Table container */}
      <div
        data-test-id={`${testId}-table-container`}
        style={{
          backgroundColor: "var(--token-color-surface)",
          border: "1px solid var(--token-color-border)",
          borderRadius: filters
            ? "0 0 var(--token-radius-lg) var(--token-radius-lg)"
            : "var(--token-radius-lg)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Loading overlay */}
        {loading && (
          <div
            data-test-id={`${testId}-loading`}
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            <span
              style={{
                fontSize: "var(--token-text-sm)",
                color: "var(--token-color-text-muted)",
              }}
            >
              Loading...
            </span>
          </div>
        )}

        {/* Horizontal scroll wrapper for wide tables */}
        <div
          style={{
            overflowX: "auto",
          }}
        >
          {children}
        </div>

        {/* Empty state */}
        {emptyState && (
          <div
            data-test-id={`${testId}-empty`}
            style={{
              padding: "var(--token-space-2xl)",
              textAlign: "center",
              color: "var(--token-color-text-muted)",
              fontSize: "var(--token-text-sm)",
            }}
          >
            {emptyState}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && (
        <div
          data-test-id={`${testId}-pagination`}
          style={{
            marginTop: "var(--token-space-md)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "var(--token-space-md)",
          }}
        >
          {pagination}
        </div>
      )}
    </div>
  );
}
