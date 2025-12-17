import { ReactNode } from "react";
import PageHeader from "../../components/layout/PageHeader";
import DataTableFrame from "../../components/layout/DataTableFrame";

/**
 * AdminListTemplate - List/table page template for admin
 *
 * Standard layout for admin list pages featuring:
 * - Page header with title and actions
 * - Filter row
 * - Data table
 * - Pagination
 *
 * Props:
 * - title: Page title
 * - subtitle: Optional subtitle
 * - headerActions: Actions in the header (e.g., "Add new" button)
 * - filters: Filter controls
 * - children: Table content
 * - pagination: Pagination controls
 * - emptyState: Content when table is empty
 * - loading: Loading state
 */

type AdminListTemplateProps = {
  title: string;
  subtitle?: string;
  headerActions?: ReactNode;
  filters?: ReactNode;
  children: ReactNode;
  pagination?: ReactNode;
  emptyState?: ReactNode;
  loading?: boolean;
  breadcrumb?: ReactNode;
};

export default function AdminListTemplate({
  title,
  subtitle,
  headerActions,
  filters,
  children,
  pagination,
  emptyState,
  loading = false,
  breadcrumb,
}: AdminListTemplateProps) {
  return (
    <div data-test-id="admin-list-template">
      {/* Page Header */}
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={headerActions}
        breadcrumb={breadcrumb}
        testId="admin-list-header"
      />

      {/* Table Frame */}
      <DataTableFrame
        filters={filters}
        pagination={pagination}
        emptyState={emptyState}
        loading={loading}
        testId="admin-list-table"
      >
        {children}
      </DataTableFrame>
    </div>
  );
}
