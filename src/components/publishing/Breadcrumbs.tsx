// Copyright (c) Santa Barbara Newcomers Club
// Server-rendered breadcrumb component for public pages

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export type BreadcrumbsProps = {
  items?: BreadcrumbItem[] | null;
  separator?: string;
  testId?: string;
};

/**
 * Breadcrumbs - pure server-rendered navigation breadcrumbs
 *
 * Renders nothing if items is null, undefined, or empty.
 * Last item renders as text only; prior items render as links if href exists.
 */
export function Breadcrumbs({
  items,
  separator = "/",
  testId = "breadcrumbs",
}: BreadcrumbsProps) {
  // Render nothing if no breadcrumbs
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      data-testid={testId}
      style={{
        fontSize: "var(--font-size-sm, 14px)",
        color: "var(--color-text-muted, #6b7280)",
        padding: "var(--spacing-sm, 8px) 0",
      }}
    >
      <ol
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "var(--spacing-xs, 4px)",
          listStyle: "none",
          margin: 0,
          padding: 0,
        }}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--spacing-xs, 4px)",
              }}
            >
              {index > 0 && (
                <span
                  aria-hidden="true"
                  style={{
                    color: "var(--color-text-muted, #9ca3af)",
                    userSelect: "none",
                  }}
                >
                  {separator}
                </span>
              )}
              {isLast ? (
                <span aria-current="page">{item.label}</span>
              ) : item.href ? (
                <a
                  href={item.href}
                  style={{
                    color: "var(--color-link, #2563eb)",
                    textDecoration: "none",
                  }}
                >
                  {item.label}
                </a>
              ) : (
                <span>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
