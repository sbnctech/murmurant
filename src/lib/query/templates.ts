export type QueryEntity = "members" | "events" | "registrations" | "payments";

export type RoleKey =
  | "PUBLIC"
  | "MEMBER"
  | "EVENT_CHAIR"
  | "VP_ACTIVITIES"
  | "FINANCE_MANAGER"
  | "VP_FINANCE"
  | "PRESIDENT"
  | "BOARD"
  | "SYSTEM_ADMIN";

export type QueryTemplateId =
  | "EVT_UPCOMING_PUBLIC"
  | "EVT_UPCOMING_MEMBER"
  | "EVT_MY_EVENTS_CHAIR"
  | "EVT_WAITLISTED"
  | "REG_MY_UPCOMING"
  | "REG_EVENT_ROSTER_CHAIR"
  | "MEM_DIRECTORY_MEMBER"
  | "MEM_NEW_MEMBERS_30D"
  | "PAY_APPROVAL_QUEUE_FINANCE";

export type QueryTemplate = {
  id: QueryTemplateId;
  entity: QueryEntity;
  minRole: RoleKey;
  description: string;
  defaultPageSize: 10 | 25 | 50;
  allowedParams: readonly string[];
};

export const QUERY_TEMPLATES: readonly QueryTemplate[] = [
  {
    id: "EVT_UPCOMING_PUBLIC",
    entity: "events",
    minRole: "PUBLIC",
    description: "Upcoming public events (safe fields only).",
    defaultPageSize: 25,
    allowedParams: ["cursor", "page_size"],
  },
  {
    id: "EVT_UPCOMING_MEMBER",
    entity: "events",
    minRole: "MEMBER",
    description: "Upcoming events visible to logged-in members.",
    defaultPageSize: 25,
    allowedParams: ["cursor", "page_size"],
  },
  {
    id: "EVT_MY_EVENTS_CHAIR",
    entity: "events",
    minRole: "EVENT_CHAIR",
    description: "Events where viewer is the chair (scope-filtered).",
    defaultPageSize: 25,
    allowedParams: ["cursor", "page_size"],
  },
  {
    id: "EVT_WAITLISTED",
    entity: "events",
    minRole: "EVENT_CHAIR",
    description: "Events with waitlist activity for chair view (scope-filtered).",
    defaultPageSize: 25,
    allowedParams: ["cursor", "page_size"],
  },
  {
    id: "REG_MY_UPCOMING",
    entity: "registrations",
    minRole: "MEMBER",
    description: "Viewer's upcoming registrations (self-scoped).",
    defaultPageSize: 25,
    allowedParams: ["cursor", "page_size"],
  },
  {
    id: "REG_EVENT_ROSTER_CHAIR",
    entity: "registrations",
    minRole: "EVENT_CHAIR",
    description: "Event roster for chair (event-scoped).",
    defaultPageSize: 50,
    allowedParams: ["cursor", "page_size"],
  },
  {
    id: "MEM_DIRECTORY_MEMBER",
    entity: "members",
    minRole: "MEMBER",
    description: "Member directory (limited fields; role-gated).",
    defaultPageSize: 25,
    allowedParams: ["cursor", "page_size"],
  },
  {
    id: "MEM_NEW_MEMBERS_30D",
    entity: "members",
    minRole: "SYSTEM_ADMIN",
    description: "New members in last 30 days (admin).",
    defaultPageSize: 25,
    allowedParams: ["cursor", "page_size"],
  },
  {
    id: "PAY_APPROVAL_QUEUE_FINANCE",
    entity: "payments",
    minRole: "FINANCE_MANAGER",
    description: "Finance approval queue (contract only; runtime deferred).",
    defaultPageSize: 25,
    allowedParams: ["cursor", "page_size"],
  },
] as const;

export function getQueryTemplate(id: QueryTemplateId): QueryTemplate {
  const t = QUERY_TEMPLATES.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown QueryTemplateId: ${id}`);
  return t;
}
