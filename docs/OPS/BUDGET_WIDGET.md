# Budget Widget Specification

**Status**: Implementation-Ready
**Audience**: President, VP Finance, Board, Tech volunteers
**Last Updated**: 2025-12-16

---

## Purpose

The Budget Widget provides at-a-glance visibility into SBNC's financial position
during a six-month budget term. It reduces manual board prep by surfacing the
information leadership currently assembles from spreadsheets.

**Key questions answered:**
- Are we on track to meet our cash target?
- How much surplus is available for deployment?
- Which committees are over/under budget?
- Is the month closed and data current?

---

## 1. User Stories

### 1.1 President Stories

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| P1 | As President, I want to see current cash vs target at a glance | Cash bar shows current position relative to $50K target |
| P2 | As President, I want to know if we're at risk of missing cash target | Red/Yellow/Green indicator with clear threshold |
| P3 | As President, I want to see available surplus for discretionary spending | Surplus amount displayed when cash exceeds target |
| P4 | As President, I want to prepare for board meetings without spreadsheets | One-click export to board packet format |
| P5 | As President, I want to see which committees need attention | Committee rollup with variance indicators |
| P6 | As President, I want to know if data is current | Month close status visible |

### 1.2 VP Finance Stories

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| F1 | As VP Finance, I want to upload actuals after month close | CSV upload with validation and preview |
| F2 | As VP Finance, I want to see budget vs actuals by line item | Drill-down from committee to line items |
| F3 | As VP Finance, I want to configure the cash target per term | Editable setting with audit trail |
| F4 | As VP Finance, I want to set alert thresholds | Configurable R/Y/G percentages |
| F5 | As VP Finance, I want to export data for board packet | PDF export with term summary |
| F6 | As VP Finance, I want to see month-by-month trends | Monthly comparison view |
| F7 | As VP Finance, I want to forecast term-end cash position | Projection based on remaining budget |
| F8 | As VP Finance, I want to verify data integrity before presenting | Validation checks and warnings |

---

## 2. Data Model

### 2.1 Core Entities

```
Term
├── id: UUID
├── slug: String (e.g., "jul-dec-2025")
├── name: String (e.g., "Jul-Dec 2025")
├── startDate: Date
├── endDate: Date
├── targetCash: Decimal (default: 50000)
├── startingCash: Decimal
└── status: Enum (PLANNING, ACTIVE, CLOSED)

BudgetLine
├── id: UUID
├── termId: UUID (FK -> Term)
├── lineItem: String
├── committee: String
├── type: Enum (REVENUE, EXPENSE)
├── month1..month6: Decimal
└── notes: String (optional)

ActualLine
├── id: UUID
├── termId: UUID (FK -> Term)
├── lineItem: String
├── month: Date (first of month)
├── amount: Decimal
├── importedAt: DateTime
└── sourceRef: String (optional, for QB reference)

MonthClose
├── id: UUID
├── termId: UUID (FK -> Term)
├── month: Date (first of month)
├── closedAt: DateTime
├── closedById: UUID (FK -> Member)
├── cashBalance: Decimal (as of month end)
└── notes: String (optional)
```

### 2.2 Relationships

```
Term (1) ──── (many) BudgetLine
Term (1) ──── (many) ActualLine
Term (1) ──── (many) MonthClose
```

### 2.3 Committee Values

Standard committees (configurable):
- Activities
- Social
- Membership
- Operations

---

## 3. Metrics and Calculations

### 3.1 Cash Position

```
Current Cash = Starting Cash + Sum(Actual Revenue) - Sum(Actual Expenses)

Projected End Cash = Current Cash
                   + Sum(Remaining Budget Revenue)
                   - Sum(Remaining Budget Expenses)

Available Surplus = Projected End Cash - Target Cash (if positive)
Cash Shortfall = Target Cash - Projected End Cash (if positive)
```

### 3.2 Budget vs Actuals

```
YTD Budget (Revenue) = Sum of budget for closed months
YTD Actual (Revenue) = Sum of actuals for closed months
Revenue Variance = YTD Actual - YTD Budget
Revenue Variance % = (Revenue Variance / YTD Budget) * 100

(Same for Expenses, inverted for "under budget = good")
```

### 3.3 Forecast

```
Remaining Months = Total months - Closed months
Remaining Budget Revenue = Sum of budget revenue for remaining months
Remaining Budget Expenses = Sum of budget expenses for remaining months
Forecast Net = Remaining Budget Revenue - Remaining Budget Expenses
```

---

## 4. R/Y/G Thresholds (Configurable)

### 4.1 Cash Target Status

| Status | Condition | Default Threshold |
|--------|-----------|-------------------|
| **Green** | Projected end cash >= Target + buffer | >= $55,000 |
| **Yellow** | Projected end cash between Target and Target + buffer | $50,000 - $54,999 |
| **Red** | Projected end cash < Target | < $50,000 |

**Configuration**:
```
FINANCE_CASH_GREEN_BUFFER = 5000  # Amount above target for Green
```

### 4.2 Budget Variance Status

| Status | Condition | Default Threshold |
|--------|-----------|-------------------|
| **Green** | Variance within tolerance | <= 10% |
| **Yellow** | Variance moderate | 10% - 25% |
| **Red** | Variance significant | > 25% |

**Configuration**:
```
FINANCE_VARIANCE_YELLOW_THRESHOLD = 10  # Percent
FINANCE_VARIANCE_RED_THRESHOLD = 25     # Percent
```

### 4.3 Committee Status

| Status | Condition |
|--------|-----------|
| **Green** | Net variance positive or within tolerance |
| **Yellow** | Net variance negative but within 15% |
| **Red** | Net variance negative and > 15% |

### 4.4 Alert Generation

Alerts are generated when status changes or thresholds are crossed:

| Alert | Trigger | Audience |
|-------|---------|----------|
| Cash at risk | Status changes to Yellow or Red | President, VP Finance |
| Surplus available | Surplus exceeds $5,000 | President, VP Finance |
| Committee over budget | Committee Red status | VP Finance |
| Month not closed | 10th of month and prior month open | VP Finance |

---

## 5. Views

### 5.1 Term Summary (Default View)

```
┌─────────────────────────────────────────────────────────────────┐
│  BUDGET WIDGET - Jul-Dec 2025                    [Month 3 of 6] │
│  Data as of: Sep 30, 2025 (closed)               [Refresh]      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CASH POSITION                                          [GREEN] │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Starting    Current     Projected    Target             │   │
│  │ $52,000     $55,900     $53,200      $50,000            │   │
│  │                                                         │   │
│  │ [████████████████████████████░░░░░░░] On Track          │   │
│  │                           ▲ You are here                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  BUDGET vs ACTUALS (YTD - 3 months closed)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Revenue     Budget: $12,000    Actual: $12,850   +7% [G] │  │
│  │ Expenses    Budget: $9,500     Actual: $8,950    -6% [G] │  │
│  │ Net         Budget: $2,500     Actual: $3,900    +56%    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  AVAILABLE SURPLUS                                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Projected end cash: $53,200                              │  │
│  │ Target cash:        $50,000                              │  │
│  │ ─────────────────────────────                            │  │
│  │ Available surplus:  $3,200    [Deploy Surplus Guide]     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [Monthly Detail]  [Committee Rollups]  [Export for Board]      │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Month-by-Month View

```
┌─────────────────────────────────────────────────────────────────┐
│  MONTHLY DETAIL - Jul-Dec 2025                    [Back]        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  MONTH STATUS                                                   │
│  Jul [●] Aug [●] Sep [●] Oct [ ] Nov [ ] Dec [ ]               │
│  ● = Closed    [ ] = Open                                       │
│                                                                 │
│         Jul      Aug      Sep      Oct      Nov      Dec        │
│        ─────    ─────    ─────    ─────    ─────    ─────       │
│ REVENUE                                                         │
│ Budget  4,000    3,500    3,000    2,800    2,600    2,400      │
│ Actual  4,350    4,100    4,400      -        -        -        │
│ Var    +9%[G]  +17%[G]  +47%[Y]                                 │
│                                                                 │
│ EXPENSES                                                        │
│ Budget  3,200    3,100    3,200    3,400    3,800    3,100      │
│ Actual  2,950    2,800    3,200      -        -        -        │
│ Var    -8%[G]  -10%[G]    0%[G]                                 │
│                                                                 │
│ NET                                                             │
│ Budget    800      400     -200     -600   -1,200     -700      │
│ Actual  1,400    1,300    1,200      -        -        -        │
│                                                                 │
│ CASH BALANCE (end of month)                                     │
│        53,400   54,700   55,900      -        -        -        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Committee Rollup View

```
┌─────────────────────────────────────────────────────────────────┐
│  COMMITTEE ROLLUPS - Jul-Dec 2025 (YTD)           [Back]        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Committee        Budget    Actual    Variance    Status        │
│  ─────────────────────────────────────────────────────────      │
│  ▶ Activities                                                   │
│      Revenue      $6,000    $6,850     +$850      [GREEN]       │
│      Expenses     $4,500    $4,100     -$400      [GREEN]       │
│      Net          $1,500    $2,750    +$1,250                   │
│                                                                 │
│  ▶ Social                                                       │
│      Revenue      $3,500    $3,800     +$300      [GREEN]       │
│      Expenses     $2,800    $2,650     -$150      [GREEN]       │
│      Net            $700    $1,150     +$450                    │
│                                                                 │
│  ▶ Membership                                                   │
│      Revenue      $2,500    $2,200     -$300      [YELLOW]      │
│      Expenses       $200      $200       $0       [GREEN]       │
│      Net          $2,300    $2,000     -$300                    │
│                                                                 │
│  ▶ Operations                                                   │
│      Revenue          $0        $0       $0       [GREEN]       │
│      Expenses     $2,000    $2,000       $0       [GREEN]       │
│      Net         -$2,000   -$2,000       $0                     │
│                                                                 │
│  TOTAL                                                          │
│      Revenue     $12,000   $12,850     +$850      [GREEN]       │
│      Expenses    $9,500    $8,950      -$550      [GREEN]       │
│      Net          $2,500    $3,900    +$1,400                   │
│                                                                 │
│  Click ▶ to expand line item detail                             │
└─────────────────────────────────────────────────────────────────┘
```

### 5.4 Drill-Down (Line Item Detail)

Clicking a committee expands to show line items:

```
  ▼ Activities
      Line Item                Budget    Actual    Variance
      ───────────────────────────────────────────────────────
      Event Reg - Hiking       $2,400    $2,650     +$250
      Event Reg - Other        $3,600    $4,200     +$600
      ───────────────────────────────────────────────────────
      Hiking Expenses          $1,200    $1,050     -$150
      Equipment                  $800      $750      -$50
      Supplies                   $500      $500       $0
      Other                    $2,000    $1,800     -$200
```

---

## 6. Board Packet Export

### 6.1 Export Contents

One-click export generates:

**Page 1: Executive Summary**
- Term name and date range
- Cash position (starting, current, projected, target)
- R/Y/G status indicator
- Available surplus or shortfall amount
- Key variance highlights (top 3)

**Page 2: Committee Summary**
- Table of all committees
- YTD budget vs actual
- Variance percentage and status
- Net by committee

**Page 3: Month-by-Month (if requested)**
- Monthly breakdown
- Cash balance progression
- Close status by month

### 6.2 Export Format

| Format | Status | Notes |
|--------|--------|-------|
| PDF | v1 | Primary format for board packets |
| CSV | v1 | For spreadsheet analysis |
| Print view | v1 | Optimized for printing |

### 6.3 Export Options

```
┌─────────────────────────────────────────────────────────────────┐
│  EXPORT FOR BOARD                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Term: Jul-Dec 2025                                             │
│  Data as of: Sep 30, 2025                                       │
│                                                                 │
│  Include:                                                       │
│  [x] Executive Summary                                          │
│  [x] Committee Rollups                                          │
│  [ ] Month-by-Month Detail                                      │
│  [ ] Line Item Detail                                           │
│                                                                 │
│  Format:                                                        │
│  (•) PDF    ( ) CSV    ( ) Print View                          │
│                                                                 │
│  [Cancel]                              [Generate Export]        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Data Integrity Checks

### 7.1 Validation on Import

| Check | Error Message | Severity |
|-------|---------------|----------|
| Line items match budget | "Unknown line item: [X]" | Error |
| Amounts are numeric | "Invalid amount: [X]" | Error |
| Dates within term | "Date outside term range" | Error |
| No duplicates | "Duplicate entry for [X]" | Error |
| Month not already closed | "Month already has data" | Warning |

### 7.2 Consistency Checks (Dashboard)

Run automatically and display warnings:

| Check | Warning Message |
|-------|-----------------|
| Cash balance mismatch | "Calculated cash differs from reported by $X" |
| Missing month data | "No actuals for [month] - is it closed?" |
| Budget totals don't match | "Budget line items don't sum to total" |
| Future actuals | "Actuals exist for future month [X]" |

### 7.3 Pre-Export Validation

Before generating board packet:

```
┌─────────────────────────────────────────────────────────────────┐
│  DATA INTEGRITY CHECK                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✓ All closed months have actuals                               │
│  ✓ Cash balance reconciles                                      │
│  ✓ No duplicate transactions                                    │
│  ⚠ October not yet closed (expected by Nov 10)                  │
│                                                                 │
│  [Proceed Anyway]                    [Wait for Data]            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Configuration

### 8.1 Settings Keys

| Key | Default | Description |
|-----|---------|-------------|
| `FINANCE_TERM_ENDING_CASH_TARGET` | `50000` | Target ending cash |
| `FINANCE_CASH_GREEN_BUFFER` | `5000` | Buffer above target for Green |
| `FINANCE_VARIANCE_YELLOW_THRESHOLD` | `10` | Percent for Yellow |
| `FINANCE_VARIANCE_RED_THRESHOLD` | `25` | Percent for Red |
| `FINANCE_MONTH_CLOSE_DAY` | `last` | Day of month for close |
| `FINANCE_CLOSE_REMINDER_DAY` | `10` | Day to remind if not closed |
| `FINANCE_BUDGET_WIDGET_VISIBLE_TO_PRESIDENT` | `true` | President access |
| `FINANCE_BUDGET_WIDGET_VISIBLE_TO_VP_FINANCE` | `true` | VP Finance access |

### 8.2 Per-Term Configuration

Each term can override defaults:

| Field | Description |
|-------|-------------|
| targetCash | Override ending cash target for this term |
| startingCash | Actual starting cash for this term |
| committees | Custom committee groupings for this term |

---

## 9. Access Control

| Role | View Summary | View Detail | Upload Data | Configure |
|------|-------------|-------------|-------------|-----------|
| President | Yes | Yes | No | Target only |
| VP Finance | Yes | Yes | Yes | All settings |
| Board Member | Summary only | No | No | No |
| Other Officers | No | No | No | No |

---

## 10. Display Configuration

### 10.1 Widget Placement

The widget can be displayed in:

| Location | Configuration Key | Default |
|----------|-------------------|---------|
| Admin Dashboard | `FINANCE_WIDGET_ON_ADMIN_DASHBOARD` | `true` |
| Standalone Page | Always available at `/admin/finance/budget` | - |
| Board Portal | `FINANCE_WIDGET_ON_BOARD_PORTAL` | `true` |

### 10.2 Responsive Behavior

| Screen Size | Behavior |
|-------------|----------|
| Desktop (1200px+) | Full widget with all views |
| Tablet (768-1199px) | Condensed summary, drill-down available |
| Mobile (<768px) | Key metrics only, link to full view |

**Primary design target**: Desktop (laptop/monitor for VP Finance and President)

---

## 11. Success Metrics

The widget is successful when:

1. **VP Finance** completes monthly update in under 15 minutes
2. **President** answers cash position questions without spreadsheets
3. **Board** receives consistent, readable financial summaries
4. **Data errors** are caught before board presentation
5. **Surplus deployment** decisions are made with clear visibility

---

## 12. Related Documents

- [QuickBooks Integration Plan](./QUICKBOOKS_INTEGRATION_PLAN.md) - Data import approach
- [Action Log Strategy](../operations/ACTION_LOG_STRATEGY.md) - Audit trail for financial actions
- [SBNC Business Model](../ORG/SBNC_BUSINESS_MODEL.md) - $50K buffer philosophy

---

*This specification defines the Budget Widget for SBNC leadership financial visibility.*
