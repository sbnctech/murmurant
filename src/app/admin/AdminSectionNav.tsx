const navItems = [
  { label: "Search", href: "#admin-search-section", testId: "admin-nav-search" },
  { label: "Dashboard summary", href: "#admin-summary-section", testId: "admin-nav-summary" },
  { label: "Members Explorer", href: "/admin/members", testId: "admin-nav-members-explorer" },
  { label: "Events Explorer", href: "/admin/events", testId: "admin-nav-events-explorer" },
  { label: "Registrations Explorer", href: "/admin/registrations", testId: "admin-nav-registrations-explorer" },
  { label: "Service History", href: "/admin/service-history", testId: "admin-nav-service-history" },
  { label: "Transitions", href: "/admin/transitions", testId: "admin-nav-transitions" },
  { label: "Members", href: "#admin-members-section", testId: "admin-nav-members" },
  { label: "Events", href: "#admin-events-section", testId: "admin-nav-events" },
  { label: "Registrations", href: "#admin-registrations-section", testId: "admin-nav-registrations" },
  { label: "Emails", href: "#admin-emails-section", testId: "admin-nav-emails" },
  { label: "System communications", href: "#admin-system-comms-section", testId: "admin-nav-system-comms" },
];

export default function AdminSectionNav() {
  return (
    <nav
      data-test-id="admin-nav"
      style={{
        marginBottom: "24px",
        paddingBottom: "12px",
        borderBottom: "1px solid #ddd",
      }}
    >
      <ul
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          listStyle: "none",
          margin: 0,
          padding: 0,
        }}
      >
        {navItems.map((item) => (
          <li key={item.testId}>
            <a
              href={item.href}
              data-test-id={item.testId}
              style={{
                color: "#0066cc",
                textDecoration: "none",
                fontSize: "14px",
              }}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
