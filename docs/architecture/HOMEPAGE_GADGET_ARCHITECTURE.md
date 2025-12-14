# Homepage Gadget Architecture

Worker 1 — Q-029 Homepage Gadget Architecture — Report

---

## 1. What a Gadget Is

A **gadget** is a homepage display component that renders pre-filtered data within strict security boundaries. The term "gadget" distinguishes homepage-specific widgets from generic UI components.

**Gadget vs Generic Widget:**

| Aspect | Generic Widget | Homepage Gadget |
|--------|----------------|-----------------|
| Context | Any page | Homepage only |
| Data source | May fetch directly | Receives pre-filtered payload |
| Lifecycle | Framework-managed | Platform-managed |
| Configuration | Developer-defined | Admin-configurable |
| Authorization | May implement locally | Never implements locally |

**Core Properties:**

- Gadgets are renderers, never deciders
- Gadgets receive data; they do not fetch data
- Gadgets display what ClubOS provides; they do not filter
- Gadgets emit navigation intent; they do not perform mutations
- Gadgets fail gracefully; they do not break the page

**What Gadgets Are Not:**

- Gadgets are not standalone applications
- Gadgets are not API clients
- Gadgets are not authorization checkpoints
- Gadgets are not data stores

---

## 2. Gadget Lifecycle

Every gadget follows a deterministic lifecycle managed by the platform.

### 2.1 Load Phase

1. Platform identifies gadgets configured for the viewer's role
2. Platform requests data for all visible gadgets in batch
3. Platform applies RBAC filtering to each data request
4. Platform delivers pre-filtered payload to each gadget
5. Gadget renders from payload; no additional requests

**Load Invariants:**

- Gadgets do not initiate their own data requests during load
- Gadgets receive only data they are authorized to display
- Gadgets that fail to load do not block other gadgets

### 2.2 Refresh Phase

1. Platform determines refresh eligibility based on gadget configuration
2. Platform re-requests data for gadgets due for refresh
3. Platform delivers updated payload
4. Gadget re-renders from new payload

**Refresh Cadences:**

- **Realtime:** Data pushed on change (e.g., waitlist positions)
- **Polling:** Platform polls at configured interval (e.g., every 5 minutes)
- **Daily:** Refresh once per session or at midnight
- **Manual:** Refresh only on explicit user action

**Refresh Invariants:**

- Gadgets do not control their own refresh timing
- Refresh failures do not corrupt previously displayed data
- Stale data is preferable to no data

### 2.3 Error Phase

When data retrieval fails:

1. Platform detects error (timeout, 5xx, malformed response)
2. Platform delivers error signal to gadget
3. Gadget displays error state per its failure mode definition
4. Platform may retry with exponential backoff

**Error Invariants:**

- Gadgets display generic error messages; they do not expose error details
- Gadgets do not distinguish between "not found" and "not authorized"
- Gadgets do not retry independently; platform manages retry

### 2.4 Empty Phase

When data retrieval succeeds but returns no records:

1. Platform delivers empty payload to gadget
2. Gadget displays empty state per its definition
3. Some gadgets hide entirely when empty; others show placeholder

**Empty State Rules:**

- Empty is not an error
- Empty states should provide navigation to relevant actions
- Empty states should not alarm or confuse the viewer

---

## 3. Data Flow

Data flows in one direction: ClubOS to gadget. Gadgets never request data directly.

### 3.1 Flow Diagram (Conceptual)

```
Viewer Session
     |
     v
ViewerContext (roles, groups, identity)
     |
     v
Gadget Configuration (which gadgets, what settings)
     |
     v
Data Request (batched, per-gadget)
     |
     v
RBAC Filter (server-side, per-request)
     |
     v
Pre-Filtered Payload
     |
     v
Gadget Render
```

### 3.2 ViewerContext

Every gadget data request includes ViewerContext:

- **Identity:** Authenticated user ID
- **Roles:** Admin, Member, EventChair, etc.
- **Groups:** Committees, households, delegations
- **Preferences:** Privacy settings (viewer's own and others')

Gadgets never see ViewerContext. They receive only the filtered result.

### 3.3 Pre-Filtered Payload

The payload delivered to a gadget has already been:

- Filtered by authorization rules
- Filtered by privacy preferences
- Redacted of sensitive fields
- Scoped to the gadget's declared dependencies

**Payload Guarantees:**

- Contains only records the viewer may see
- Contains only fields the gadget declared as dependencies
- Contains no data from other viewers
- Contains no data outside the gadget's scope

### 3.4 What Gadgets Cannot Do

- Request unfiltered data
- Request data for other viewers
- Bypass RBAC by constructing direct API calls
- Access data not declared in their manifest

---

## 4. RBAC Enforcement Rules

Authorization is enforced by ClubOS, never by gadgets. The following rules are absolute.

**Rule 1: Server-Side Only**

- All authorization decisions occur server-side before data reaches the gadget
- Client-side code cannot be trusted; it runs in an adversarial environment
- No gadget logic may determine what data is visible

**Rule 2: Viewer Sees Own Data**

- Self-scoped gadgets (e.g., My Upcoming Events) return only the viewer's records
- The gadget does not filter; it receives only appropriate records

**Rule 3: Role Determines Visibility**

- Gadgets are visible only to roles declared in the gadget manifest
- A gadget configured for Admin role is not rendered for Member role
- Role filtering occurs before any data request

**Rule 4: Committee Scope Enforced**

- Committee-scoped gadgets (e.g., Event Chair Dashboard) see only their committee's data
- The viewer's committee membership is verified server-side
- Cross-committee visibility requires explicit Admin role

**Rule 5: Privacy Preferences Honored**

- Members who opt out of directory visibility are excluded from directory gadgets
- Privacy filtering is applied server-side; gadgets receive only visible records
- Gadgets cannot override or bypass privacy preferences

**Rule 6: High-Sensitivity Gadgets Restricted**

- Gadgets with High RBAC sensitivity (e.g., Membership Metrics) require Admin or equivalent role
- Aggregate data about other members requires elevated authorization
- Sensitivity classification is declared in the gadget manifest and enforced at runtime

**Rule 7: Errors Do Not Leak**

- 403 Forbidden and 404 Not Found are indistinguishable to gadgets
- Gadgets cannot infer record existence from error patterns
- Error messages do not reveal what data exists

---

## 5. Personalization Rules

Viewers may personalize their homepage within strict limits.

### 5.1 Allowed Personalization

- **Gadget visibility:** Hide gadgets the viewer does not want (within role limits)
- **Gadget order:** Rearrange gadget positions on the page
- **Gadget size:** Choose between supported sizes (small, medium, large) if gadget allows
- **Gadget settings:** Adjust configuration options defined by the gadget (e.g., number of items to display)

### 5.2 Forbidden Personalization

- **Role escalation:** Viewer cannot enable gadgets restricted to higher roles
- **Data expansion:** Viewer cannot configure gadgets to show data outside their authorization
- **Scope bypass:** Viewer cannot change self-scoped gadgets to show other members' data
- **Privacy override:** Viewer cannot make opted-out members visible
- **Refresh override:** Viewer cannot force refresh faster than platform allows

### 5.3 Personalization Persistence

- Personalization settings are stored per-viewer
- Settings apply only to the viewer who configured them
- Admins may define role-based default layouts
- Viewer settings override defaults within allowed limits

### 5.4 Reset Capability

- Viewers may reset to role-default layout
- Admins may push layout changes that override stale personalization
- Corrupt personalization data is replaced with defaults

---

## 6. Failure and Degraded Modes

Gadgets must handle failures without breaking the homepage or leaking information.

### 6.1 Network Failure

**Behavior:** Display "Unable to load" message with retry option.

**Rules:**

- Do not display partial or stale data unless explicitly designed for offline
- Do not expose network error details to the viewer
- Do not block other gadgets from loading

### 6.2 Authorization Failure

**Behavior:** Gadget is not rendered; no error shown.

**Rules:**

- If viewer is not authorized for a gadget, it does not appear
- No "access denied" message for gadgets; they simply do not exist for that viewer
- Authorization is checked before rendering decision

### 6.3 Data Unavailable

**Behavior:** Display gadget-specific empty state.

**Rules:**

- Empty is not an error
- Empty state should suggest next action (e.g., "Browse events")
- Some gadgets hide when empty; this is specified in the gadget manifest

### 6.4 Partial Data

**Behavior:** Render available data; indicate incomplete state if necessary.

**Rules:**

- Prefer partial rendering over complete failure
- If critical fields are missing, treat as data unavailable
- Do not guess or infer missing values

### 6.5 Timeout

**Behavior:** Same as network failure.

**Rules:**

- Platform enforces timeout; gadgets do not implement their own
- Timeout thresholds are configured per-gadget based on expected data size
- Timeout does not corrupt other gadgets

### 6.6 Cascading Failure Prevention

**Rules:**

- Each gadget is isolated; one failure does not propagate
- Gadget errors are logged server-side for diagnostics
- Homepage remains usable even if multiple gadgets fail

---

## 7. Extensibility Rules

New gadgets may be added following these rules.

### 7.1 Registration

- New gadgets must declare a manifest with all required fields
- Manifest is validated at build time; invalid manifests are rejected
- Gadgets are registered in a central registry

### 7.2 Required Manifest Fields

Every gadget manifest must include:

- **gadget_id:** Stable identifier (e.g., W-MEM-01)
- **version:** Semantic version string
- **display_name:** Human-readable title
- **description:** One-sentence purpose
- **required_roles:** Roles that may see this gadget
- **data_dependencies:** Declared data sources and fields
- **data_scope:** self, committee, or global
- **rbac_sensitivity:** Low, Medium, or High
- **failure_mode:** Behavior when data unavailable
- **supported_sizes:** Array of allowed sizes
- **refresh_cadence:** realtime, polling, daily, or manual
- **config_schema:** JSON schema for admin-configurable settings

### 7.3 Data Dependency Declaration

- Gadgets declare exactly what data they need
- Platform provides only declared data; nothing extra
- Undeclared dependencies cause build-time failure
- Dependencies are reviewed during gadget approval

### 7.4 Security Review

- New gadgets require security review before deployment
- High-sensitivity gadgets require additional review
- Third-party gadgets (future) require sandbox execution

### 7.5 Versioning

- Gadgets are versioned independently
- Breaking changes require version bump
- Platform supports multiple gadget versions during migration
- Deprecated gadgets are removed after notice period

### 7.6 Prohibited Patterns

The following patterns are prohibited in gadget implementations:

- Direct API calls bypassing platform data layer
- Local storage of data beyond session
- Cross-gadget communication outside platform channels
- Inline scripts or external script loading
- Authorization logic of any kind
- Data filtering beyond presentation formatting

### 7.7 Approval Process

1. Developer creates gadget manifest and implementation
2. Build-time validation checks manifest completeness
3. Security review assesses data dependencies and scope
4. Admin approval enables gadget for specific roles
5. Gadget becomes available in role-based default layouts

---

## Cross-References

- Widget Data Contract Principles: docs/architecture/WIDGET_DATA_CONTRACT_PRINCIPLES.md
- Widget Library Research: docs/product/WIDGET_LIBRARY_RESEARCH.md
- RBAC Overview: docs/rbac/AUTH_AND_RBAC.md

---

## Verdict

READY FOR REVIEW
