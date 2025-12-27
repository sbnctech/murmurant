# Organizational Representation - Architectural Sketch

```
Status: INTENT MODEL - Not implementation
Purpose: Define conceptual architecture for assisted presentation reconstruction
Related: Epic #306, #301 (Cutover Rehearsal), #202 (WA Migration)
```

---

## 1. Conceptual Model

This sketch defines the **intent model** for organizational representation reconstruction. It is NOT a Prisma schema. It is NOT implementation code. It describes what we are trying to achieve and the conceptual structures needed.

### 1.1 Content Inventory

The system maintains an inventory of discovered content from the source system:

```
ContentInventory
├── pages[]
│   ├── sourceId          -- WA page identifier
│   ├── title             -- Page title as discovered
│   ├── path              -- URL path in source
│   ├── contentType       -- page | section | widget
│   ├── extractedText     -- Sanitized text content
│   ├── extractedAssets[] -- Referenced images, files
│   └── metadata          -- Additional properties
│
├── sections[]
│   ├── sourceId
│   ├── parentPageId
│   ├── position          -- Order within page
│   ├── contentType       -- heading | text | image | list
│   └── content           -- Extracted content
│
├── navigation[]
│   ├── sourceId
│   ├── label             -- Menu item text
│   ├── targetPageId      -- Link destination
│   ├── position          -- Order in menu
│   └── parentNavId       -- For nested menus
│
└── assets[]
    ├── sourceUrl
    ├── assetType         -- image | document | other
    ├── filename
    └── status            -- discovered | fetched | failed
```

### 1.2 Representation Intent

For each inventory item, we track the **representation intent** - how we propose to reconstruct it in ClubOS:

```
RepresentationIntent
├── inventoryItemId      -- Reference to source item
├── sourceReference      -- How we observed this
├── proposedAction       -- create | map | skip | defer
├── confidenceLevel      -- high | medium | low | manual
├── humanApprovalState   -- pending | approved | rejected | modified
├── proposedTarget       -- Where in ClubOS this maps
└── transformationNotes  -- Explanation of what we propose
```

**Confidence Levels:**

| Level | Meaning | User Experience |
|-------|---------|-----------------|
| high | Strong match; likely correct | Default selected |
| medium | Reasonable guess; verify | Highlighted for review |
| low | Uncertain; needs decision | Flagged for attention |
| manual | Cannot automate; human required | Must be addressed |

---

## 2. Assisted Workflow

The reconstruction follows a four-phase workflow with explicit operator and customer roles:

### 2.1 Discover Phase

**Goal:** Build the content inventory from source system.

**Activities:**
- Enumerate pages from WA sitemap or navigation
- Extract page structure and content
- Catalog assets (images, documents)
- Map navigation hierarchy

**Output:** Populated ContentInventory

**Role:** System (automated)

### 2.2 Suggest Phase

**Goal:** Generate proposed representation for each inventory item.

**Activities:**
- Match source pages to ClubOS page types
- Propose navigation structure
- Suggest content transformations
- Flag items requiring manual attention

**Output:** RepresentationIntent for each item

**Role:** System (automated)

### 2.3 Review Phase

**Goal:** Operator and customer validate suggestions.

**Activities:**
- Review proposed mappings
- Modify suggestions as needed
- Approve or reject individual items
- Address flagged items

**Output:** Approved/rejected intents

**Roles:**
- **Operator:** Technical validation, handles edge cases
- **Customer:** Business validation, confirms organizational fit

### 2.4 Approve Phase

**Goal:** Final confirmation before commit.

**Activities:**
- Preview complete representation
- Compare against source
- Confirm ready for commit
- OR abort if not satisfactory

**Output:** Approval decision

**Role:** Customer (final authority)

---

## 3. Preview Surface

The preview surface allows stakeholders to see the proposed representation before committing.

### 3.1 Capabilities

| Capability | Description |
|------------|-------------|
| Read-only rendering | View proposed pages in ClubOS layout |
| Source comparison | Side-by-side with WA original |
| Diff view | Highlight differences from source |
| Approval interface | Mark items as approved/rejected |
| Progress tracking | Show completion status |

### 3.2 Approval Gate

No content is published without passing the approval gate:

```
ApprovalGate
├── requiredApprovals    -- What must be approved
├── currentApprovals     -- What has been approved
├── blockers[]           -- Items preventing commit
└── canCommit            -- Boolean: ready to proceed
```

**Blockers include:**
- Items with `manual` confidence not addressed
- Required pages without approval
- Assets with `failed` status
- Navigation with broken links

---

## 4. State Transitions

Each representation intent follows a state machine:

```
                    ┌──────────┐
                    │  draft   │
                    └────┬─────┘
                         │ operator review
                         ▼
                    ┌──────────┐
            ┌───────┤ reviewed │───────┐
            │       └────┬─────┘       │
            │ rejected   │ approved    │ modified
            ▼            ▼             │
       ┌────────┐   ┌──────────┐       │
       │ aborted│   │ approved │◄──────┘
       └────────┘   └────┬─────┘
                         │ customer commit
                         ▼
                    ┌──────────┐
                    │committed │
                    └──────────┘
```

**State Definitions:**

| State | Meaning | Allowed Transitions |
|-------|---------|---------------------|
| draft | Initial proposal generated | reviewed |
| reviewed | Operator has examined | approved, aborted, modified |
| approved | Ready for commit | committed, aborted |
| committed | Applied to ClubOS | (terminal) |
| aborted | Rejected; will not apply | (terminal) |

**Modified:** Returns to `reviewed` with changes tracked.

---

## 5. Explicit Deferrals

The following are explicitly NOT in scope for initial implementation:

### 5.1 No CMS Engine

This is NOT a full content management system. We are not building:
- WYSIWYG page editing
- Template customization UI
- Live preview editing
- Content versioning system

Reconstruction creates pages. Page management is a separate concern.

### 5.2 No WYSIWYG Editor

Visual editing of reconstructed content is deferred. Initial flow is:
1. System generates content
2. Human reviews and approves
3. Editing (if needed) is done through existing ClubOS interfaces

### 5.3 No Automatic Publishing

Even after commit, content does not auto-publish. Publication is a separate workflow with its own approvals (see existing publishing model).

---

## 6. Relationship to Intent Journal

The Cutover Rehearsal Mode (#301) defines an Intent Journal that records all decisions during migration.

### 6.1 Representation Approvals as Intent

Each representation approval is recorded as an intent entry:

```
IntentEntry
├── type: "representation:approval"
├── itemId: <RepresentationIntent.id>
├── action: approved | rejected | modified
├── actor: <who made decision>
├── timestamp: <when>
└── rationale: <optional explanation>
```

### 6.2 Replay During Rehearsal

Intent journal entries are replayable:
- During rehearsal, representation approvals can be "played back"
- This validates that the reconstruction process is deterministic
- Differences between rehearsals are flagged for investigation

### 6.3 Abort Preserves Intent

If migration is aborted:
- Intent journal is preserved for analysis
- Representation intents are marked as aborted
- Can inform future migration attempt

---

## 7. Cross-Links

| Document | Relationship |
|----------|--------------|
| Epic #306 | Parent epic for this work |
| Epic #301 | Cutover Rehearsal Mode; intent journal |
| Epic #202 | WA Migration parent wave |
| [Presentation Philosophy](../BIZ/ORGANIZATIONAL_PRESENTATION_PHILOSOPHY.md) | Customer-facing explanation |
| [Business Model](../BIZ/BUSINESS_MODEL_CANONICAL.md) | Business context (if available) |

---

## 8. Open Questions

| Question | Status |
|----------|--------|
| How to handle WA widgets with no ClubOS equivalent? | Deferred to implementation |
| Asset storage location and limits? | Deferred to implementation |
| Incremental update after initial commit? | Deferred; initial scope is one-time migration |
| Multi-language content? | Not in initial scope |

---

_This is an intent model, not an implementation specification. Actual implementation may differ in structure while preserving the conceptual model._
