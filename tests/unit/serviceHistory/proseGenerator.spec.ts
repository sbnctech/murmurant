/**
 * Unit tests for the Member History Prose Generator
 */

import { describe, it, expect } from "vitest";
import {
  generateMemberHistoryProse,
  generatePlainTextExport,
  type MemberHistoryInput,
} from "@/lib/serviceHistory/proseGenerator";

describe("proseGenerator", () => {
  describe("generateMemberHistoryProse", () => {
    const baseInput: MemberHistoryInput = {
      memberId: "test-member-1",
      memberName: "Alice Chen",
      stats: {
        eventsAttended: 0,
        volunteerRoles: 0,
        leadershipRoles: 0,
        yearsActive: 0,
      },
      timeline: [],
    };

    describe("new member with no history", () => {
      it("generates prose for new member", () => {
        const result = generateMemberHistoryProse(baseInput);

        expect(result.fullProse).toContain("Alice Chen");
        expect(result.fullProse).toContain("new member");
        expect(result.fullProse).toContain("Santa Barbara Newcomers Club");
      });

      it("generates short summary for new member", () => {
        const result = generateMemberHistoryProse(baseInput);

        expect(result.shortSummary).toContain("Alice Chen");
        expect(result.shortSummary).toContain("new member");
      });

      it("generates markdown for new member", () => {
        const result = generateMemberHistoryProse(baseInput);

        expect(result.markdown).toContain("# Service History: Alice Chen");
        expect(result.markdown).toContain("## Summary");
        expect(result.markdown).toContain("**Years Active:** 0");
      });
    });

    describe("member with years of tenure", () => {
      it("handles 1 year member correctly", () => {
        const input: MemberHistoryInput = {
          ...baseInput,
          stats: { ...baseInput.stats, yearsActive: 1 },
        };

        const result = generateMemberHistoryProse(input);

        expect(result.fullProse).toContain("for one year");
        expect(result.shortSummary).toContain("1 year member");
      });

      it("handles multi-year member correctly", () => {
        const input: MemberHistoryInput = {
          ...baseInput,
          stats: { ...baseInput.stats, yearsActive: 5 },
        };

        const result = generateMemberHistoryProse(input);

        expect(result.fullProse).toContain("for 5 years");
        expect(result.shortSummary).toContain("5 year member");
      });
    });

    describe("member with leadership roles", () => {
      it("includes leadership contributions in prose", () => {
        const input: MemberHistoryInput = {
          ...baseInput,
          stats: { ...baseInput.stats, leadershipRoles: 2, yearsActive: 3 },
          timeline: [
            {
              id: "1",
              serviceType: "BOARD_OFFICER",
              roleTitle: "President",
              committeeName: null,
              eventTitle: null,
              startAt: "2023-02-01T00:00:00Z",
              endAt: "2024-02-01T00:00:00Z",
              isActive: false,
            },
            {
              id: "2",
              serviceType: "COMMITTEE_CHAIR",
              roleTitle: "Chair",
              committeeName: "Activities",
              eventTitle: null,
              startAt: "2024-02-01T00:00:00Z",
              endAt: null,
              isActive: true,
            },
          ],
        };

        const result = generateMemberHistoryProse(input);

        expect(result.fullProse).toContain("Leadership Contributions");
        expect(result.fullProse).toContain("President");
        expect(result.fullProse).toContain("Chair (Activities)");
        expect(result.fullProse).toContain("[current]");
      });

      it("includes leadership in markdown", () => {
        const input: MemberHistoryInput = {
          ...baseInput,
          stats: { ...baseInput.stats, leadershipRoles: 1 },
          timeline: [
            {
              id: "1",
              serviceType: "BOARD_OFFICER",
              roleTitle: "Treasurer",
              committeeName: null,
              eventTitle: null,
              startAt: "2023-02-01T00:00:00Z",
              endAt: null,
              isActive: true,
            },
          ],
        };

        const result = generateMemberHistoryProse(input);

        expect(result.markdown).toContain("## Leadership History");
        expect(result.markdown).toContain("Treasurer");
      });
    });

    describe("member with volunteer roles", () => {
      it("includes volunteer service in prose", () => {
        const input: MemberHistoryInput = {
          ...baseInput,
          stats: { ...baseInput.stats, volunteerRoles: 2 },
          timeline: [
            {
              id: "1",
              serviceType: "COMMITTEE_MEMBER",
              roleTitle: "Member",
              committeeName: "Hospitality",
              eventTitle: null,
              startAt: "2023-06-01T00:00:00Z",
              endAt: "2024-06-01T00:00:00Z",
              isActive: false,
            },
            {
              id: "2",
              serviceType: "EVENT_HOST",
              roleTitle: "Host",
              committeeName: null,
              eventTitle: "Welcome Coffee",
              startAt: "2024-03-15T00:00:00Z",
              endAt: "2024-03-15T00:00:00Z",
              isActive: false,
            },
          ],
        };

        const result = generateMemberHistoryProse(input);

        expect(result.fullProse).toContain("Volunteer Service");
        expect(result.fullProse).toContain("Member (Hospitality)");
        expect(result.fullProse).toContain("Host (Welcome Coffee)");
      });

      it("includes volunteer history in markdown", () => {
        const input: MemberHistoryInput = {
          ...baseInput,
          stats: { ...baseInput.stats, volunteerRoles: 1 },
          timeline: [
            {
              id: "1",
              serviceType: "COMMITTEE_MEMBER",
              roleTitle: "Member",
              committeeName: "Social",
              eventTitle: null,
              startAt: "2023-06-01T00:00:00Z",
              endAt: null,
              isActive: true,
            },
          ],
        };

        const result = generateMemberHistoryProse(input);

        expect(result.markdown).toContain("## Volunteer History");
        expect(result.markdown).toContain("Member (Social)");
      });
    });

    describe("member with event attendance", () => {
      it("includes single event in prose", () => {
        const input: MemberHistoryInput = {
          ...baseInput,
          stats: { ...baseInput.stats, eventsAttended: 1 },
        };

        const result = generateMemberHistoryProse(input);

        expect(result.fullProse).toContain("1 club event");
        expect(result.shortSummary).toContain("1 event attended");
      });

      it("includes multiple events in prose", () => {
        const input: MemberHistoryInput = {
          ...baseInput,
          stats: { ...baseInput.stats, eventsAttended: 12 },
        };

        const result = generateMemberHistoryProse(input);

        expect(result.fullProse).toContain("12 club events");
        expect(result.shortSummary).toContain("12 events attended");
      });
    });

    describe("member with active roles", () => {
      it("highlights current roles in prose", () => {
        const input: MemberHistoryInput = {
          ...baseInput,
          stats: { ...baseInput.stats, leadershipRoles: 1 },
          timeline: [
            {
              id: "1",
              serviceType: "BOARD_OFFICER",
              roleTitle: "Vice President",
              committeeName: null,
              eventTitle: null,
              startAt: "2024-02-01T00:00:00Z",
              endAt: null,
              isActive: true,
            },
          ],
        };

        const result = generateMemberHistoryProse(input);

        expect(result.fullProse).toContain("Currently serving as: Vice President");
        expect(result.shortSummary).toContain("Currently: Vice President");
      });

      it("includes current roles section in markdown", () => {
        const input: MemberHistoryInput = {
          ...baseInput,
          timeline: [
            {
              id: "1",
              serviceType: "COMMITTEE_CHAIR",
              roleTitle: "Chair",
              committeeName: "Membership",
              eventTitle: null,
              startAt: "2024-02-01T00:00:00Z",
              endAt: null,
              isActive: true,
            },
          ],
        };

        const result = generateMemberHistoryProse(input);

        expect(result.markdown).toContain("## Current Roles");
        expect(result.markdown).toContain("**Chair** - Membership");
      });
    });

    describe("complete timeline in markdown", () => {
      it("generates table with all entries", () => {
        const input: MemberHistoryInput = {
          ...baseInput,
          stats: { ...baseInput.stats, leadershipRoles: 1, volunteerRoles: 1 },
          timeline: [
            {
              id: "1",
              serviceType: "BOARD_OFFICER",
              roleTitle: "Secretary",
              committeeName: null,
              eventTitle: null,
              startAt: "2023-02-01T00:00:00Z",
              endAt: "2024-02-01T00:00:00Z",
              isActive: false,
            },
            {
              id: "2",
              serviceType: "EVENT_HOST",
              roleTitle: "Host",
              committeeName: null,
              eventTitle: "Holiday Party",
              startAt: "2023-12-15T00:00:00Z",
              endAt: "2023-12-15T00:00:00Z",
              isActive: false,
            },
          ],
        };

        const result = generateMemberHistoryProse(input);

        expect(result.markdown).toContain("## Complete Timeline");
        expect(result.markdown).toContain("| Role | Type | Context | Period | Status |");
        expect(result.markdown).toContain("Secretary");
        expect(result.markdown).toContain("Board Officer");
        expect(result.markdown).toContain("Holiday Party");
        expect(result.markdown).toContain("Event Host");
        expect(result.markdown).toContain("Completed");
      });
    });

    describe("short summary format", () => {
      it("combines all stats in short summary", () => {
        const input: MemberHistoryInput = {
          ...baseInput,
          stats: {
            eventsAttended: 10,
            volunteerRoles: 3,
            leadershipRoles: 2,
            yearsActive: 4,
          },
          timeline: [
            {
              id: "1",
              serviceType: "BOARD_OFFICER",
              roleTitle: "President",
              committeeName: null,
              eventTitle: null,
              startAt: "2024-02-01T00:00:00Z",
              endAt: null,
              isActive: true,
            },
          ],
        };

        const result = generateMemberHistoryProse(input);

        expect(result.shortSummary).toContain("Alice Chen (4 year member)");
        expect(result.shortSummary).toContain("2 leadership roles");
        expect(result.shortSummary).toContain("3 volunteer roles");
        expect(result.shortSummary).toContain("10 events attended");
        expect(result.shortSummary).toContain("Currently: President");
      });

      it("handles singular forms correctly", () => {
        const input: MemberHistoryInput = {
          ...baseInput,
          stats: {
            eventsAttended: 1,
            volunteerRoles: 1,
            leadershipRoles: 1,
            yearsActive: 1,
          },
        };

        const result = generateMemberHistoryProse(input);

        expect(result.shortSummary).toContain("1 leadership role");
        expect(result.shortSummary).not.toContain("1 leadership roles");
        expect(result.shortSummary).toContain("1 volunteer role");
        expect(result.shortSummary).not.toContain("1 volunteer roles");
        expect(result.shortSummary).toContain("1 event attended");
        expect(result.shortSummary).not.toContain("1 events attended");
      });
    });

    describe("markdown footer", () => {
      it("includes footer in markdown", () => {
        const result = generateMemberHistoryProse(baseInput);

        expect(result.markdown).toContain("---");
        expect(result.markdown).toContain("Santa Barbara Newcomers Club");
        expect(result.markdown).toContain("Member Service History");
      });
    });
  });

  describe("generatePlainTextExport", () => {
    it("returns the full prose output", () => {
      const input: MemberHistoryInput = {
        memberId: "test-1",
        memberName: "Bob Smith",
        stats: {
          eventsAttended: 5,
          volunteerRoles: 2,
          leadershipRoles: 1,
          yearsActive: 3,
        },
        timeline: [],
      };

      const result = generatePlainTextExport(input);

      expect(result).toContain("Bob Smith");
      expect(result).toContain("3 years");
    });
  });
});
