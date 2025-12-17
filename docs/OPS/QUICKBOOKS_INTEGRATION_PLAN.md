# QuickBooks Integration Plan

**Status**: Planning
**Audience**: VP Finance, Tech volunteers, Board
**Last Updated**: 2025-12-16

---

## Purpose

This document defines how SBNC will import financial data from QuickBooks into
ClubOS for budget tracking and reporting. The design prioritizes:

1. **No hard dependency** - ClubOS works without QuickBooks connection
2. **Configurable mapping** - Accounts and categories are user-defined
3. **Future flexibility** - Can support other accounting systems later

---

## 1. Integration Approach

### 1.1 Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   QuickBooks    │     │   Import Layer   │     │    ClubOS       │
│   (Source)      │────▶│   (Mapping)      │────▶│   (Budget DB)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                       │                        │
        │                       │                        │
   Export CSV             Config File              Budget Widget
   or API pull           (YAML/JSON)              Dashboard View
```

### 1.2 Import Methods (Phased)

| Phase | Method | Description | Status |
|-------|--------|-------------|--------|
| **v1** | CSV Upload | VP Finance exports from QB, uploads to ClubOS | Initial |
| **v2** | Scheduled Pull | Automated monthly pull after close | Future |
| **v3** | Real-time Sync | Live connection (if needed) | Future |

### 1.3 No Hard Dependency

ClubOS must function without QuickBooks:

- Manual data entry always available
- CSV import from any source (not just QB)
- Budget widget works with whatever data is present
- Missing data shows "No data" rather than errors

---

## 2. Data Mapping Concepts

### 2.1 QuickBooks to ClubOS Mapping

| QuickBooks Concept | ClubOS Concept | Notes |
|-------------------|----------------|-------|
| Account | Budget Category | Income/Expense classification |
| Class | Committee | Optional; if QB uses classes |
| Location | Committee | Alternative to Class |
| Customer:Job | Event (optional) | For event-level tracking |
| Date | Period (Month) | Grouped by month for reporting |

### 2.2 Mapping Configuration File

The mapping is defined in a configuration file, not hard-coded.

**Location**: `config/quickbooks-mapping.yaml` (or stored in Settings table)

**Format**:

```yaml
# QuickBooks Integration Mapping Configuration
# SBNC ClubOS - Finance Module

version: "1.0"
last_updated: "2025-07-01"

# Term configuration
terms:
  current: "Jul-Dec 2025"
  start_date: "2025-07-01"
  end_date: "2025-12-31"

# Account to Budget Category mapping
account_mapping:
  # Revenue accounts
  "4000 - Membership Dues":
    category: "Membership Dues"
    type: "Revenue"
    committee: "Membership"

  "4100 - Event Registration - Hiking":
    category: "Event Registrations - Hiking"
    type: "Revenue"
    committee: "Activities"

  "4110 - Event Registration - Wine":
    category: "Event Registrations - Wine"
    type: "Revenue"
    committee: "Social"

  # Expense accounts
  "6000 - Event Expenses - Hiking":
    category: "Hiking Expenses"
    type: "Expense"
    committee: "Activities"

  "6100 - Event Expenses - Wine":
    category: "Wine Event Expenses"
    type: "Expense"
    committee: "Social"

  "6500 - Insurance":
    category: "Insurance"
    type: "Expense"
    committee: "Operations"

# Class/Location to Committee mapping (if QB uses classes)
class_mapping:
  "Activities": "Activities"
  "Social": "Social"
  "Membership": "Membership"
  "Operations": "Operations"

# Import settings
import_settings:
  # Which date field to use
  date_field: "Transaction Date"

  # Amount field (positive = revenue, negative = expense, or separate columns)
  amount_mode: "signed"  # or "separate_columns"
  amount_field: "Amount"

  # Skip rows matching these patterns
  skip_patterns:
    - "Opening Balance"
    - "Closing Balance"
    - "TOTAL"

# Validation rules
validation:
  # Require all transactions to map to a known account
  require_account_match: true

  # Allow unmapped accounts (log warning but import)
  allow_unmapped: false

  # Date range validation
  reject_future_dates: true
  reject_dates_before: "2020-01-01"
```

### 2.3 Handling Unmapped Accounts

When an import contains accounts not in the mapping:

| Setting | Behavior |
|---------|----------|
| `allow_unmapped: false` | Reject import, show errors |
| `allow_unmapped: true` | Import to "Uncategorized" with warning |

VP Finance reviews warnings and updates mapping as needed.

---

## 3. Import Workflow

### 3.1 Monthly Close Process

```
1. QuickBooks month-end close completed (by 5th of following month)
        │
        ▼
2. VP Finance exports transactions for closed month
   - Format: CSV (Transaction Detail report)
   - Date range: First to last day of month
        │
        ▼
3. VP Finance uploads CSV to ClubOS
   - System validates against mapping
   - Shows preview of what will be imported
        │
        ▼
4. VP Finance confirms import
   - Data written to ActualLine table
   - Month marked as "closed" in system
        │
        ▼
5. Budget Widget updates automatically
   - Actuals vs Budget comparison refreshed
   - Alerts generated if thresholds exceeded
```

### 3.2 Import Validation

Before committing an import, the system validates:

| Check | Error if fails |
|-------|----------------|
| All accounts map to categories | "Unknown account: [name]" |
| Dates within expected month | "Transaction date outside range" |
| Amounts are numeric | "Invalid amount: [value]" |
| No duplicate transactions | "Duplicate: [ref] on [date]" |
| Month not already closed | "Month [X] already has imported data" |

### 3.3 Import Preview

Before committing, VP Finance sees:

```
┌─────────────────────────────────────────────────────────────────┐
│  IMPORT PREVIEW - September 2025                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  File: QB_Transactions_Sep2025.csv                              │
│  Rows: 47 transactions                                          │
│                                                                 │
│  SUMMARY BY CATEGORY                                            │
│  ─────────────────────────────────────────────────────────      │
│  Revenue                                                        │
│    Membership Dues              $1,050.00                       │
│    Event Registrations - Hiking   $625.00                       │
│    Event Registrations - Wine     $780.00                       │
│    Event Registrations - Social   $340.00                       │
│  ─────────────────────────────────────────────────────────      │
│  Total Revenue                  $2,795.00                       │
│                                                                 │
│  Expenses                                                       │
│    Hiking Expenses                $285.00                       │
│    Wine Event Expenses            $542.00                       │
│    Social Event Expenses          $198.00                       │
│    Insurance                      $200.00                       │
│    Website/Tech                    $95.00                       │
│  ─────────────────────────────────────────────────────────      │
│  Total Expenses                 $1,320.00                       │
│                                                                 │
│  NET FOR MONTH                  $1,475.00                       │
│                                                                 │
│  ⚠ WARNINGS                                                     │
│  None                                                           │
│                                                                 │
│  [Cancel]                              [Confirm Import]         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Scheduled Pull (v2 - Future)

### 4.1 Approach

After initial CSV workflow is proven, add optional automated pull:

```
┌─────────────────┐
│ Scheduled Job   │ Runs on 6th of each month
│ (cron/worker)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ QuickBooks API  │ OAuth2 connection
│ Pull Request    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Same validation │ As CSV import
│ & mapping logic │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Pending Review  │ VP Finance approves before commit
└─────────────────┘
```

### 4.2 Authentication (OAuth2)

QuickBooks Online uses OAuth2. Implementation notes:

| Component | Approach |
|-----------|----------|
| Client credentials | Stored in environment variables |
| Refresh tokens | Stored encrypted in database |
| Token refresh | Automatic before expiry |
| Scope | Read-only financial data |

**Security requirements**:
- Tokens never logged
- Refresh tokens encrypted at rest
- Admin-only access to connection settings

### 4.3 Manual Refresh Option

Even with scheduled pulls, VP Finance can trigger manual refresh:

- "Refresh from QuickBooks" button in widget
- Uses same validation/preview flow
- Useful for mid-month checks

---

## 5. Dev-Mode Stub Loader

For development and testing without QuickBooks access.

### 5.1 Sample Data Files

**Location**: `prisma/seed-data/finance/`

```
prisma/seed-data/finance/
├── sample-budget-jul-dec-2025.csv
├── sample-actuals-jul-2025.csv
├── sample-actuals-aug-2025.csv
├── sample-actuals-sep-2025.csv
└── sample-mapping.yaml
```

### 5.2 Sample Budget CSV

```csv
term,line_item,committee,type,month_1,month_2,month_3,month_4,month_5,month_6
Jul-Dec 2025,Membership Dues,Membership,Revenue,2000,1500,1000,800,600,400
Jul-Dec 2025,Event Registrations - Hiking,Activities,Revenue,800,800,600,400,200,400
Jul-Dec 2025,Event Registrations - Wine,Social,Revenue,600,600,700,600,800,600
Jul-Dec 2025,Hiking Expenses,Activities,Expense,400,400,300,200,100,200
Jul-Dec 2025,Wine Event Expenses,Social,Expense,500,500,600,500,700,500
Jul-Dec 2025,Insurance,Operations,Expense,200,200,200,200,200,200
```

### 5.3 Sample Actuals CSV (QuickBooks export format)

```csv
Transaction Date,Account,Class,Amount,Memo
2025-07-05,4000 - Membership Dues,,2150.00,July membership deposits
2025-07-08,4100 - Event Registration - Hiking,Activities,875.00,Summit Hike registrations
2025-07-12,4110 - Event Registration - Wine,Social,625.00,Wine Tasting #1
2025-07-15,6000 - Event Expenses - Hiking,Activities,-385.00,Guide fees
2025-07-18,6100 - Event Expenses - Wine,Social,-487.50,Wine purchases
2025-07-25,6500 - Insurance,,-200.00,Monthly premium
```

### 5.4 Seed Script

```typescript
// prisma/seed-finance.ts

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function seedFinanceData() {
  const dataDir = join(__dirname, 'seed-data/finance');

  // Load and parse budget
  const budgetCsv = readFileSync(join(dataDir, 'sample-budget-jul-dec-2025.csv'));
  const budgetRows = parse(budgetCsv, { columns: true });

  // Create term
  const term = await prisma.term.upsert({
    where: { slug: 'jul-dec-2025' },
    update: {},
    create: {
      slug: 'jul-dec-2025',
      name: 'Jul-Dec 2025',
      startDate: new Date('2025-07-01'),
      endDate: new Date('2025-12-31'),
      targetCash: 50000,
    },
  });

  // Create budget lines
  for (const row of budgetRows) {
    await prisma.budgetLine.create({
      data: {
        termId: term.id,
        lineItem: row.line_item,
        committee: row.committee,
        type: row.type,
        month1: parseFloat(row.month_1),
        month2: parseFloat(row.month_2),
        month3: parseFloat(row.month_3),
        month4: parseFloat(row.month_4),
        month5: parseFloat(row.month_5),
        month6: parseFloat(row.month_6),
      },
    });
  }

  // Load actuals for each closed month
  const months = ['jul', 'aug', 'sep'];
  for (const month of months) {
    const file = join(dataDir, `sample-actuals-${month}-2025.csv`);
    try {
      const actualsCsv = readFileSync(file);
      const actualsRows = parse(actualsCsv, { columns: true });

      for (const row of actualsRows) {
        await prisma.actualLine.create({
          data: {
            termId: term.id,
            transactionDate: new Date(row['Transaction Date']),
            account: row.Account,
            lineItem: mapAccountToLineItem(row.Account), // uses mapping config
            amount: parseFloat(row.Amount),
            memo: row.Memo || null,
          },
        });
      }
    } catch (e) {
      // File doesn't exist - skip
    }
  }

  console.log('Finance seed data loaded');
}

function mapAccountToLineItem(account: string): string {
  // Simplified mapping for seed script
  const mapping: Record<string, string> = {
    '4000 - Membership Dues': 'Membership Dues',
    '4100 - Event Registration - Hiking': 'Event Registrations - Hiking',
    '4110 - Event Registration - Wine': 'Event Registrations - Wine',
    '6000 - Event Expenses - Hiking': 'Hiking Expenses',
    '6100 - Event Expenses - Wine': 'Wine Event Expenses',
    '6500 - Insurance': 'Insurance',
  };
  return mapping[account] || 'Uncategorized';
}

seedFinanceData();
```

---

## 6. Future: Other Accounting Systems

The mapping-based approach supports other systems:

| System | Export Format | Mapping Adjustments |
|--------|---------------|---------------------|
| QuickBooks Desktop | IIF or CSV | Different account format |
| Wave | CSV | Different column names |
| Xero | CSV | Different date format |
| Manual spreadsheet | CSV | Custom columns |

To add a new system:
1. Create new mapping configuration
2. Adjust column name mappings in config
3. Same import/validation logic applies

---

## 7. Settings

### 7.1 Configuration Keys

| Key | Default | Description |
|-----|---------|-------------|
| `FINANCE_QB_INTEGRATION_ENABLED` | `false` | Enable QB import features |
| `FINANCE_QB_AUTO_PULL_ENABLED` | `false` | Enable scheduled pulls (v2) |
| `FINANCE_QB_PULL_DAY` | `6` | Day of month for auto-pull |
| `FINANCE_ALLOW_UNMAPPED_ACCOUNTS` | `false` | How to handle unknown accounts |
| `FINANCE_IMPORT_REQUIRES_APPROVAL` | `true` | Require VP Finance confirmation |

### 7.2 Access Control

| Action | Required Role |
|--------|---------------|
| Upload CSV import | VP Finance, Admin |
| Confirm import | VP Finance, Admin |
| Edit mapping configuration | Admin |
| View import history | VP Finance, Admin, President |
| Trigger manual refresh | VP Finance, Admin |

---

## 8. Implementation Phases

### Phase 1: CSV Import (v1)
- Manual CSV upload
- Mapping configuration file
- Import validation and preview
- Basic seed data for development

### Phase 2: Scheduled Pull (v2)
- QuickBooks API OAuth2 integration
- Scheduled monthly pull
- Pending review queue
- Manual refresh option

### Phase 3: Multi-System Support (v3)
- Abstracted import interface
- Support for additional accounting systems
- User-configurable column mappings

---

## 9. Security Considerations

| Concern | Mitigation |
|---------|------------|
| Financial data exposure | Role-based access; VP Finance and Admin only |
| OAuth token theft | Encrypted storage; short-lived access tokens |
| Import manipulation | Audit log of all imports; approval workflow |
| Data integrity | Validation rules; duplicate detection |

---

## 10. Success Metrics

The integration is successful when:

1. **VP Finance** can complete monthly import in under 15 minutes
2. **Import errors** are caught before data is committed
3. **Budget Widget** updates automatically after import
4. **No manual data entry** required after QB export

---

*This document defines the QuickBooks integration approach for SBNC financial data import.*
