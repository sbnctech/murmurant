# Parliamentarian Role

Copyright (c) Santa Barbara Newcomers Club

## Responsibilities Summary

The Parliamentarian serves as the club's procedural expert and governance advisor. This role maintains the integrity of rules, policies, and procedural practices without holding executive authority over member-facing content or finances.

**Core duties:**

- Advise the Board on parliamentary procedure during meetings
- Maintain and interpret the club's bylaws and standing rules
- Annotate policies with procedural guidance
- Document official interpretations of governance documents
- Flag potential procedural issues for Board review

## Capabilities

### What the Parliamentarian CAN do

| Capability | Description |
|------------|-------------|
| `meetings:read` | View all Board meeting records |
| `meetings:motions:read` | View motions and their status |
| `meetings:motions:annotate` | Add procedural annotations to motions |
| `governance:rules:manage` | Manage standing rules and procedures |
| `governance:flags:create` | Create compliance/procedural flags |
| `governance:interpretations:create` | Create interpretation log entries |
| `governance:interpretations:edit` | Edit interpretation log entries |
| `governance:interpretations:publish` | Publish interpretations to Board |
| `governance:policies:annotate` | Add annotations to bylaws/policies |
| `governance:policies:propose_change` | Propose changes for Board consideration |
| `governance:docs:read` | Read internal governance documents |
| `governance:docs:write` | Write/maintain governance documents |

### What the Parliamentarian CANNOT do

| Restricted Area | Rationale |
|-----------------|-----------|
| `content:board:publish` | Cannot publish member-facing content - advisory role only |
| `finance:view` / `finance:manage` | No financial oversight authority |
| `members:view` / `members:history` | No need to access member PII or service records |
| `publishing:manage` | Website content is not within governance scope |
| `users:manage` | Cannot change role assignments |
| `exports:access` | No data export authority |
| `meetings:minutes:draft:create` | Secretary prepares minutes, not Parliamentarian |
| `admin:full` | Not a system administrator |

## Governance Rationale

### Charter Alignment

This role implements several Charter principles:

- **P2 (Default deny, least privilege):** The Parliamentarian has narrowly scoped capabilities limited to governance and procedural matters. No access to member data, finances, or publishing.

- **P3 (Separation of execution from policy):** The Parliamentarian advises on policy interpretation but cannot unilaterally implement changes. Proposed changes require Board approval.

- **P5 (Undoable actions):** Interpretations and annotations are logged and can be reviewed/revised by the Board.

### Separation of Concerns

The Parliamentarian role is deliberately separated from:

1. **Secretary:** The Secretary records what happened; the Parliamentarian advises on what should happen procedurally.

2. **President:** The President executes decisions; the Parliamentarian advises on proper procedure for making decisions.

3. **Webmaster:** The Parliamentarian maintains internal governance docs; the Webmaster manages public-facing content.

### Interpretation Log

The Parliamentarian maintains an interpretation log documenting:

- How specific bylaw provisions have been interpreted
- Precedents for procedural questions
- Guidance on standing rules application

This log serves as institutional memory, ensuring consistent application of rules across leadership transitions.

## Workflow Integration

### Proposing Policy Changes

1. Parliamentarian identifies need for policy clarification or change
2. Creates proposal with `governance:policies:propose_change`
3. Board reviews and votes on proposal
4. If approved, Parliamentarian documents the change
5. President or admin publishes the updated policy

### Creating Interpretations

1. Board or officer raises procedural question
2. Parliamentarian researches precedent and rules
3. Creates interpretation entry with rationale
4. May publish interpretation for Board reference
5. Interpretation becomes part of governance record

## Related Documentation

- [Architectural Charter](../ARCHITECTURAL_CHARTER.md) - Core system principles
- [ROLES_SECRETARY.md](./ROLES_SECRETARY.md) - Complementary governance role
