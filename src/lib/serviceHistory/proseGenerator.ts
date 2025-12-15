/**
 * Prose Generator for Member Service History
 *
 * Generates human-readable prose summaries of member service history
 * suitable for president briefings and board reviews.
 *
 * This is a READ-ONLY presentation utility. It does not modify any data.
 */

import { formatClubMonthYear, formatClubDate } from "@/lib/timezone";

// ============================================================================
// Types
// ============================================================================

export interface MemberHistoryStats {
  eventsAttended: number;
  volunteerRoles: number;
  leadershipRoles: number;
  yearsActive: number;
}

export interface TimelineEntry {
  id: string;
  serviceType: string;
  roleTitle: string;
  committeeName: string | null;
  eventTitle: string | null;
  startAt: string;
  endAt: string | null;
  isActive: boolean;
}

export interface MemberHistoryInput {
  memberId: string;
  memberName: string;
  stats: MemberHistoryStats;
  timeline: TimelineEntry[];
}

export interface ProseOutput {
  /** Full prose summary for president briefings */
  fullProse: string;
  /** Shorter summary for board reviews */
  shortSummary: string;
  /** Markdown formatted version */
  markdown: string;
}

// ============================================================================
// Service Type Helpers
// ============================================================================

function formatServiceType(type: string): string {
  switch (type) {
    case "BOARD_OFFICER":
      return "Board Officer";
    case "COMMITTEE_CHAIR":
      return "Committee Chair";
    case "COMMITTEE_MEMBER":
      return "Committee Member";
    case "EVENT_HOST":
      return "Event Host";
    default:
      return type;
  }
}

function isLeadershipRole(type: string): boolean {
  return type === "BOARD_OFFICER" || type === "COMMITTEE_CHAIR";
}

function isVolunteerRole(type: string): boolean {
  return type === "COMMITTEE_MEMBER" || type === "EVENT_HOST";
}

// ============================================================================
// Date Formatting
// ============================================================================

function formatPeriod(startAt: string, endAt: string | null): string {
  const startDate = new Date(startAt);
  const start = formatClubMonthYear(startDate);

  if (!endAt) {
    return `${start} - present`;
  }

  const endDate = new Date(endAt);
  const end = formatClubMonthYear(endDate);

  // If same month/year, just show one date
  if (start === end) {
    return start;
  }

  return `${start} - ${end}`;
}

// ============================================================================
// Prose Generation
// ============================================================================

/**
 * Generate comprehensive prose summary of member service history.
 *
 * Tone: Factual, neutral, chronological.
 * Audience: President briefings, board reviews.
 */
export function generateMemberHistoryProse(input: MemberHistoryInput): ProseOutput {
  const { memberName, stats, timeline } = input;

  // Separate roles by type
  const leadershipRoles = timeline.filter((t) => isLeadershipRole(t.serviceType));
  const volunteerRoles = timeline.filter((t) => isVolunteerRole(t.serviceType));
  const activeRoles = timeline.filter((t) => t.isActive);

  // Build full prose
  const fullProse = buildFullProse(memberName, stats, leadershipRoles, volunteerRoles, activeRoles);

  // Build short summary
  const shortSummary = buildShortSummary(memberName, stats, activeRoles);

  // Build markdown
  const markdown = buildMarkdown(memberName, stats, timeline, leadershipRoles, volunteerRoles, activeRoles);

  return { fullProse, shortSummary, markdown };
}

/**
 * Build full prose narrative for president briefings.
 */
function buildFullProse(
  memberName: string,
  stats: MemberHistoryStats,
  leadershipRoles: TimelineEntry[],
  volunteerRoles: TimelineEntry[],
  activeRoles: TimelineEntry[]
): string {
  const parts: string[] = [];

  // Opening with membership tenure
  if (stats.yearsActive === 0) {
    parts.push(`${memberName} is a new member of Santa Barbara Newcomers Club.`);
  } else if (stats.yearsActive === 1) {
    parts.push(`${memberName} has been a member of Santa Barbara Newcomers Club for one year.`);
  } else {
    parts.push(
      `${memberName} has been a member of Santa Barbara Newcomers Club for ${stats.yearsActive} years.`
    );
  }

  // Leadership contributions (board/chair roles)
  if (leadershipRoles.length > 0) {
    parts.push("");
    parts.push("Leadership Contributions:");

    // Sort by start date (newest first)
    const sortedLeadership = [...leadershipRoles].sort(
      (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
    );

    for (const role of sortedLeadership) {
      const committee = role.committeeName ? ` (${role.committeeName})` : "";
      const period = formatPeriod(role.startAt, role.endAt);
      const status = role.isActive ? " [current]" : "";
      parts.push(`- ${role.roleTitle}${committee}: ${period}${status}`);
    }
  }

  // Volunteer contributions (committee member/event host)
  if (volunteerRoles.length > 0) {
    parts.push("");
    parts.push("Volunteer Service:");

    // Sort by start date (newest first)
    const sortedVolunteer = [...volunteerRoles].sort(
      (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
    );

    for (const role of sortedVolunteer) {
      const context = role.committeeName || role.eventTitle || "";
      const contextStr = context ? ` (${context})` : "";
      const period = formatPeriod(role.startAt, role.endAt);
      const status = role.isActive ? " [current]" : "";
      parts.push(`- ${role.roleTitle}${contextStr}: ${period}${status}`);
    }
  }

  // Event participation
  if (stats.eventsAttended > 0) {
    parts.push("");
    const eventsText =
      stats.eventsAttended === 1
        ? "Has attended 1 club event."
        : `Has attended ${stats.eventsAttended} club events.`;
    parts.push(eventsText);
  }

  // Current active roles
  if (activeRoles.length > 0) {
    parts.push("");
    const activeList = activeRoles.map((r) => r.roleTitle).join(", ");
    parts.push(`Currently serving as: ${activeList}.`);
  }

  return parts.join("\n");
}

/**
 * Build short summary for board review handouts.
 */
function buildShortSummary(
  memberName: string,
  stats: MemberHistoryStats,
  activeRoles: TimelineEntry[]
): string {
  const summaryParts: string[] = [];

  // Name and tenure
  const tenureText =
    stats.yearsActive === 0
      ? "new member"
      : stats.yearsActive === 1
        ? "1 year member"
        : `${stats.yearsActive} year member`;

  summaryParts.push(`${memberName} (${tenureText})`);

  // Contribution counts
  const counts: string[] = [];
  if (stats.leadershipRoles > 0) {
    counts.push(`${stats.leadershipRoles} leadership role${stats.leadershipRoles !== 1 ? "s" : ""}`);
  }
  if (stats.volunteerRoles > 0) {
    counts.push(`${stats.volunteerRoles} volunteer role${stats.volunteerRoles !== 1 ? "s" : ""}`);
  }
  if (stats.eventsAttended > 0) {
    counts.push(`${stats.eventsAttended} event${stats.eventsAttended !== 1 ? "s" : ""} attended`);
  }

  if (counts.length > 0) {
    summaryParts.push(counts.join(", "));
  }

  // Current status
  if (activeRoles.length > 0) {
    const activeList = activeRoles.map((r) => r.roleTitle).join(", ");
    summaryParts.push(`Currently: ${activeList}`);
  }

  return summaryParts.join(". ") + ".";
}

/**
 * Build markdown formatted version for export.
 */
function buildMarkdown(
  memberName: string,
  stats: MemberHistoryStats,
  timeline: TimelineEntry[],
  leadershipRoles: TimelineEntry[],
  volunteerRoles: TimelineEntry[],
  activeRoles: TimelineEntry[]
): string {
  const lines: string[] = [];

  // Title
  lines.push(`# Service History: ${memberName}`);
  lines.push("");
  lines.push(`Generated: ${formatClubDate(new Date())}`);
  lines.push("");

  // Summary stats
  lines.push("## Summary");
  lines.push("");
  lines.push(`- **Years Active:** ${stats.yearsActive}`);
  lines.push(`- **Leadership Roles:** ${stats.leadershipRoles}`);
  lines.push(`- **Volunteer Roles:** ${stats.volunteerRoles}`);
  lines.push(`- **Events Attended:** ${stats.eventsAttended}`);
  lines.push("");

  // Current status
  if (activeRoles.length > 0) {
    lines.push("## Current Roles");
    lines.push("");
    for (const role of activeRoles) {
      const context = role.committeeName || role.eventTitle || "";
      const contextStr = context ? ` - ${context}` : "";
      lines.push(`- **${role.roleTitle}**${contextStr}`);
    }
    lines.push("");
  }

  // Leadership history
  if (leadershipRoles.length > 0) {
    lines.push("## Leadership History");
    lines.push("");

    // Sort by start date (newest first)
    const sorted = [...leadershipRoles].sort(
      (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
    );

    for (const role of sorted) {
      const committee = role.committeeName ? ` (${role.committeeName})` : "";
      const period = formatPeriod(role.startAt, role.endAt);
      lines.push(`- ${role.roleTitle}${committee}: ${period}`);
    }
    lines.push("");
  }

  // Volunteer history
  if (volunteerRoles.length > 0) {
    lines.push("## Volunteer History");
    lines.push("");

    // Sort by start date (newest first)
    const sorted = [...volunteerRoles].sort(
      (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
    );

    for (const role of sorted) {
      const context = role.committeeName || role.eventTitle || "";
      const contextStr = context ? ` (${context})` : "";
      const period = formatPeriod(role.startAt, role.endAt);
      lines.push(`- ${role.roleTitle}${contextStr}: ${period}`);
    }
    lines.push("");
  }

  // Full timeline
  if (timeline.length > 0) {
    lines.push("## Complete Timeline");
    lines.push("");
    lines.push("| Role | Type | Context | Period | Status |");
    lines.push("|------|------|---------|--------|--------|");

    // Sort by start date (newest first)
    const sorted = [...timeline].sort(
      (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
    );

    for (const entry of sorted) {
      const type = formatServiceType(entry.serviceType);
      const context = entry.committeeName || entry.eventTitle || "-";
      const period = formatPeriod(entry.startAt, entry.endAt);
      const status = entry.isActive ? "Active" : "Completed";
      lines.push(`| ${entry.roleTitle} | ${type} | ${context} | ${period} | ${status} |`);
    }
    lines.push("");
  }

  // Footer
  lines.push("---");
  lines.push("*Santa Barbara Newcomers Club - Member Service History*");

  return lines.join("\n");
}

/**
 * Generate a simple plain text export (for clipboard).
 */
export function generatePlainTextExport(input: MemberHistoryInput): string {
  const { fullProse } = generateMemberHistoryProse(input);
  return fullProse;
}
