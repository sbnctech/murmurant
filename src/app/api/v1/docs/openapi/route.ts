/**
 * OpenAPI Specification Endpoint
 *
 * GET /api/v1/docs/openapi - Returns OpenAPI 3.0 specification
 *
 * This provides machine-readable API documentation for:
 * - Development tools (Postman, Insomnia)
 * - API clients (code generation)
 * - Documentation viewers (Swagger UI, Redoc)
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { NextResponse } from "next/server";

// OpenAPI 3.0 Specification
const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Murmurant API",
    description: "Internal API for Santa Barbara Newcomers Club management system",
    version: "1.0.0",
    contact: {
      name: "Tech Lead",
      url: "https://github.com/sbnewcomers/murmurant",
    },
  },
  servers: [
    {
      url: "/api/v1",
      description: "Current API version",
    },
  ],
  tags: [
    { name: "Members", description: "Member management" },
    { name: "Events", description: "Event management" },
    { name: "Registrations", description: "Event registrations" },
    { name: "Support", description: "Support case management" },
    { name: "Governance", description: "Meeting minutes and motions" },
    { name: "Auth", description: "Authentication endpoints" },
    { name: "Admin", description: "Administrative functions" },
  ],
  paths: {
    "/members": {
      get: {
        tags: ["Members"],
        summary: "List members",
        description: "Get paginated list of members with optional filtering",
        parameters: [
          { name: "status", in: "query", schema: { type: "string" }, description: "Filter by status code" },
          { name: "search", in: "query", schema: { type: "string" }, description: "Search by name or email" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
        ],
        responses: {
          "200": {
            description: "List of members",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MemberListResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
        security: [{ session: [] }],
      },
    },
    "/members/{id}": {
      get: {
        tags: ["Members"],
        summary: "Get member details",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": {
            description: "Member details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Member" },
              },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
        },
        security: [{ session: [] }],
      },
    },
    "/events": {
      get: {
        tags: ["Events"],
        summary: "List events",
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "PUBLISHED", "CANCELED"] } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "startAfter", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
        ],
        responses: {
          "200": {
            description: "List of events",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/EventListResponse" },
              },
            },
          },
        },
      },
    },
    "/events/{id}": {
      get: {
        tags: ["Events"],
        summary: "Get event details",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": {
            description: "Event details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Event" },
              },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/events/{id}/status": {
      post: {
        tags: ["Events"],
        summary: "Change event status",
        description: "Perform a state machine transition on the event",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["action"],
                properties: {
                  action: { type: "string", enum: ["submit", "approve", "request_changes", "publish", "cancel"] },
                  note: { type: "string", description: "Optional note for the action" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Status changed successfully" },
          "400": { $ref: "#/components/responses/BadRequest" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
        security: [{ session: [] }],
      },
    },
    "/events/{id}/register": {
      post: {
        tags: ["Registrations"],
        summary: "Register for an event",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  ticketTierId: { type: "string", format: "uuid" },
                  guestCount: { type: "integer", default: 0 },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Registration created" },
          "400": { $ref: "#/components/responses/BadRequest" },
          "409": { description: "Already registered or event full" },
        },
        security: [{ session: [] }],
      },
      delete: {
        tags: ["Registrations"],
        summary: "Cancel registration",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Registration cancelled" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
        security: [{ session: [] }],
      },
    },
    "/support/cases": {
      get: {
        tags: ["Support"],
        summary: "List support cases",
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["OPEN", "AWAITING_INFO", "IN_PROGRESS", "ESCALATED", "RESOLVED", "CLOSED"] } },
        ],
        responses: {
          "200": { description: "List of support cases" },
        },
        security: [{ session: [] }],
      },
      post: {
        tags: ["Support"],
        summary: "Create a support case",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SupportCaseCreate" },
            },
          },
        },
        responses: {
          "201": { description: "Support case created" },
        },
        security: [{ session: [] }],
      },
    },
    "/support/cases/{id}": {
      get: {
        tags: ["Support"],
        summary: "Get support case details",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Support case details with notes" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
        security: [{ session: [] }],
      },
      patch: {
        tags: ["Support"],
        summary: "Update support case",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SupportCaseUpdate" },
            },
          },
        },
        responses: {
          "200": { description: "Support case updated" },
        },
        security: [{ session: [] }],
      },
    },
    "/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current user",
        responses: {
          "200": {
            description: "Current user profile",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CurrentUser" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
        security: [{ session: [] }],
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "End session",
        responses: {
          "200": { description: "Logged out successfully" },
        },
        security: [{ session: [] }],
      },
    },
    "/officer/communications/dashboard": {
      get: {
        tags: ["Admin"],
        summary: "VP Communications dashboard",
        responses: {
          "200": {
            description: "Dashboard data for VP Communications",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CommunicationsDashboard" },
              },
            },
          },
        },
        security: [{ session: [] }],
      },
    },
    "/support/dashboard": {
      get: {
        tags: ["Support"],
        summary: "Support dashboard statistics",
        responses: {
          "200": { description: "Support case statistics" },
        },
        security: [{ session: [] }],
      },
    },
  },
  components: {
    schemas: {
      Member: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          firstName: { type: "string" },
          lastName: { type: "string" },
          email: { type: "string", format: "email" },
          phone: { type: "string", nullable: true },
          joinedAt: { type: "string", format: "date-time" },
          membershipStatus: {
            type: "object",
            properties: {
              code: { type: "string" },
              label: { type: "string" },
            },
          },
        },
      },
      MemberListResponse: {
        type: "object",
        properties: {
          members: { type: "array", items: { $ref: "#/components/schemas/Member" } },
          pagination: { $ref: "#/components/schemas/Pagination" },
        },
      },
      Event: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          description: { type: "string", nullable: true },
          startTime: { type: "string", format: "date-time" },
          endTime: { type: "string", format: "date-time", nullable: true },
          location: { type: "string", nullable: true },
          status: { type: "string", enum: ["DRAFT", "PENDING_APPROVAL", "CHANGES_REQUESTED", "APPROVED", "PUBLISHED", "CANCELED", "COMPLETED"] },
          category: { type: "string", nullable: true },
        },
      },
      EventListResponse: {
        type: "object",
        properties: {
          events: { type: "array", items: { $ref: "#/components/schemas/Event" } },
          pagination: { $ref: "#/components/schemas/Pagination" },
        },
      },
      SupportCaseCreate: {
        type: "object",
        required: ["submitterName", "channel", "description"],
        properties: {
          submitterName: { type: "string" },
          submitterEmail: { type: "string", format: "email" },
          channel: { type: "string", enum: ["EMAIL", "TEXT", "SLACK", "IN_PERSON", "PHONE", "OTHER"] },
          description: { type: "string" },
        },
      },
      SupportCaseUpdate: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["OPEN", "AWAITING_INFO", "IN_PROGRESS", "ESCALATED", "RESOLVED", "CLOSED"] },
          category: { type: "string" },
          note: { type: "string" },
        },
      },
      CurrentUser: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          memberId: { type: "string", format: "uuid" },
          globalRole: { type: "string" },
          member: {
            type: "object",
            properties: {
              firstName: { type: "string" },
              lastName: { type: "string" },
            },
          },
        },
      },
      CommunicationsDashboard: {
        type: "object",
        properties: {
          visible: { type: "boolean" },
          eventsOpeningThisWeek: { type: "array", items: { type: "object" } },
          newlyAnnouncedEvents: { type: "array", items: { type: "object" } },
          eventsFillingFast: { type: "array", items: { type: "object" } },
          newMembers: { type: "array", items: { type: "object" } },
          membersCompletingThisMonth: { type: "array", items: { type: "object" } },
          enewsDrafts: { type: "array", items: { type: "object" } },
          stats: {
            type: "object",
            properties: {
              totalEventsThisWeek: { type: "integer" },
              totalNewMembers: { type: "integer" },
              totalAtRisk: { type: "integer" },
              upcomingEvents: { type: "integer" },
            },
          },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer" },
          limit: { type: "integer" },
          total: { type: "integer" },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
          message: { type: "string" },
        },
      },
    },
    responses: {
      BadRequest: {
        description: "Bad Request",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      Unauthorized: {
        description: "Unauthorized - not logged in",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      Forbidden: {
        description: "Forbidden - insufficient permissions",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      NotFound: {
        description: "Not Found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
    },
    securitySchemes: {
      session: {
        type: "apiKey",
        in: "cookie",
        name: "murmurant_session",
        description: "Session cookie from login",
      },
    },
  },
};

/**
 * GET /api/v1/docs/openapi
 */
export async function GET() {
  return NextResponse.json(openApiSpec, {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
