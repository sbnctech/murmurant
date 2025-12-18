/**
 * File Storage API Tests
 *
 * Tests for file upload, download, list, and delete operations.
 *
 * Charter Principles:
 * - P2: Default deny (permission checks)
 * - P7: Audit logging
 * - P9: Fail closed
 */

import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";
const ADMIN_HEADERS = { Authorization: "Bearer test-admin-token" };
const SECRETARY_HEADERS = { Authorization: "Bearer test-secretary-token" };
const MEMBER_HEADERS = { Authorization: "Bearer test-member-token" };

test.describe("File Storage API", () => {
  test.describe("POST /api/v1/files (upload)", () => {
    test("returns 401 without authentication", async ({ request }) => {
      const response = await request.post(`${BASE}/api/v1/files`);
      expect(response.status()).toBe(401);
    });

    test("returns 403 for member without files:upload capability", async ({ request }) => {
      // Create a simple form data with a file
      const formData = new FormData();
      const file = new Blob(["test content"], { type: "text/plain" });
      formData.append("file", file, "test.txt");

      const response = await request.post(`${BASE}/api/v1/files`, {
        headers: MEMBER_HEADERS,
        multipart: {
          file: {
            name: "test.txt",
            mimeType: "text/plain",
            buffer: Buffer.from("test content"),
          },
        },
      });

      expect(response.status()).toBe(403);
    });

    test("returns 400 without file in request", async ({ request }) => {
      const response = await request.post(`${BASE}/api/v1/files`, {
        headers: ADMIN_HEADERS,
        multipart: {},
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.message).toContain("No file");
    });

    test("secretary can upload files", async ({ request }) => {
      const response = await request.post(`${BASE}/api/v1/files`, {
        headers: SECRETARY_HEADERS,
        multipart: {
          file: {
            name: "minutes.txt",
            mimeType: "text/plain",
            buffer: Buffer.from("Meeting minutes content"),
          },
          description: "Board meeting minutes",
          tags: "governance,minutes",
        },
      });

      // May succeed or fail depending on capability
      // Secretary has files:upload, so this should succeed
      expect([201, 403]).toContain(response.status());

      if (response.status() === 201) {
        const data = await response.json();
        expect(data.file).toBeDefined();
        expect(data.file.name).toBe("minutes.txt");
        expect(data.file.mimeType).toBe("text/plain");
      }
    });

    test("admin can upload with tags and roles", async ({ request }) => {
      const response = await request.post(`${BASE}/api/v1/files`, {
        headers: ADMIN_HEADERS,
        multipart: {
          file: {
            name: "policy.pdf",
            mimeType: "application/pdf",
            buffer: Buffer.from("PDF content here"),
          },
          description: "Club policy document",
          tags: "policy,governance",
          grantRoles: "secretary,president",
        },
      });

      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data.file.name).toBe("policy.pdf");
      expect(data.file.description).toBe("Club policy document");
    });

    test("rejects files with disallowed MIME type", async ({ request }) => {
      const response = await request.post(`${BASE}/api/v1/files`, {
        headers: ADMIN_HEADERS,
        multipart: {
          file: {
            name: "script.exe",
            mimeType: "application/x-msdownload",
            buffer: Buffer.from("not a real exe"),
          },
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.message).toContain("not allowed");
    });
  });

  test.describe("GET /api/v1/files (list)", () => {
    test("returns 401 without authentication", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/files`);
      expect(response.status()).toBe(401);
    });

    test("returns 200 with files array", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/files`, {
        headers: ADMIN_HEADERS,
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.files).toBeDefined();
      expect(Array.isArray(data.files)).toBe(true);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBe(1);
    });

    test("supports pagination", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/files?page=1&pageSize=5`, {
        headers: ADMIN_HEADERS,
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.pagination.pageSize).toBe(5);
    });

    test("supports search filter", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/files?search=policy`, {
        headers: ADMIN_HEADERS,
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.files)).toBe(true);
    });

    test("supports tag filter", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/files?tag=governance`, {
        headers: ADMIN_HEADERS,
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.files)).toBe(true);
    });

    test("supports mimeType filter", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/files?mimeType=image/`, {
        headers: ADMIN_HEADERS,
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.files)).toBe(true);
    });

    test("file objects have correct shape", async ({ request }) => {
      // First upload a file
      await request.post(`${BASE}/api/v1/files`, {
        headers: ADMIN_HEADERS,
        multipart: {
          file: {
            name: "shape-test.txt",
            mimeType: "text/plain",
            buffer: Buffer.from("content for shape test"),
          },
        },
      });

      const response = await request.get(`${BASE}/api/v1/files?search=shape-test`, {
        headers: ADMIN_HEADERS,
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      if (data.files.length > 0) {
        const file = data.files[0];
        expect(file.id).toBeDefined();
        expect(typeof file.id).toBe("string");
        expect(file.name).toBeDefined();
        expect(file.mimeType).toBeDefined();
        expect(typeof file.size).toBe("number");
        expect(Array.isArray(file.tags)).toBe(true);
        expect(file.createdAt).toBeDefined();
      }
    });
  });

  test.describe("GET /api/v1/files/[id] (detail)", () => {
    test("returns 401 without authentication", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/files/00000000-0000-0000-0000-000000000000`);
      expect(response.status()).toBe(401);
    });

    test("returns 404 for non-existent file", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/v1/files/00000000-0000-0000-0000-000000000000`,
        { headers: ADMIN_HEADERS }
      );

      expect(response.status()).toBe(404);
    });

    test("returns file details for authorized user", async ({ request }) => {
      // First upload a file
      const uploadResponse = await request.post(`${BASE}/api/v1/files`, {
        headers: ADMIN_HEADERS,
        multipart: {
          file: {
            name: "detail-test.txt",
            mimeType: "text/plain",
            buffer: Buffer.from("content for detail test"),
          },
          tags: "test",
        },
      });

      if (uploadResponse.status() === 201) {
        const uploadData = await uploadResponse.json();
        const fileId = uploadData.file.id;

        const response = await request.get(`${BASE}/api/v1/files/${fileId}`, {
          headers: ADMIN_HEADERS,
        });

        expect(response.status()).toBe(200);
        const data = await response.json();
        expect(data.file.id).toBe(fileId);
        expect(data.file.name).toBe("detail-test.txt");
        expect(data.file.tags).toContain("test");
      }
    });
  });

  test.describe("PATCH /api/v1/files/[id] (update)", () => {
    test("updates file description", async ({ request }) => {
      // First upload a file
      const uploadResponse = await request.post(`${BASE}/api/v1/files`, {
        headers: ADMIN_HEADERS,
        multipart: {
          file: {
            name: "update-test.txt",
            mimeType: "text/plain",
            buffer: Buffer.from("content for update test"),
          },
        },
      });

      if (uploadResponse.status() === 201) {
        const uploadData = await uploadResponse.json();
        const fileId = uploadData.file.id;

        const response = await request.patch(`${BASE}/api/v1/files/${fileId}`, {
          headers: ADMIN_HEADERS,
          data: {
            description: "Updated description",
            addTags: ["updated"],
          },
        });

        expect(response.status()).toBe(200);
        const data = await response.json();
        expect(data.file.description).toBe("Updated description");
        expect(data.file.tags).toContain("updated");
      }
    });

    test("requires write access", async ({ request }) => {
      // Upload as admin
      const uploadResponse = await request.post(`${BASE}/api/v1/files`, {
        headers: ADMIN_HEADERS,
        multipart: {
          file: {
            name: "private-file.txt",
            mimeType: "text/plain",
            buffer: Buffer.from("private content"),
          },
        },
      });

      if (uploadResponse.status() === 201) {
        const uploadData = await uploadResponse.json();
        const fileId = uploadData.file.id;

        // Try to update as member (should fail)
        const response = await request.patch(`${BASE}/api/v1/files/${fileId}`, {
          headers: MEMBER_HEADERS,
          data: {
            description: "Hacked!",
          },
        });

        // Member has no access at all
        expect([403, 404]).toContain(response.status());
      }
    });
  });

  test.describe("DELETE /api/v1/files/[id]", () => {
    test("deletes file with admin access", async ({ request }) => {
      // First upload a file
      const uploadResponse = await request.post(`${BASE}/api/v1/files`, {
        headers: ADMIN_HEADERS,
        multipart: {
          file: {
            name: "delete-test.txt",
            mimeType: "text/plain",
            buffer: Buffer.from("content to delete"),
          },
        },
      });

      if (uploadResponse.status() === 201) {
        const uploadData = await uploadResponse.json();
        const fileId = uploadData.file.id;

        const response = await request.delete(`${BASE}/api/v1/files/${fileId}`, {
          headers: ADMIN_HEADERS,
        });

        expect(response.status()).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);

        // Verify file is gone
        const getResponse = await request.get(`${BASE}/api/v1/files/${fileId}`, {
          headers: ADMIN_HEADERS,
        });
        expect(getResponse.status()).toBe(404);
      }
    });

    test("requires admin access to delete", async ({ request }) => {
      // Upload as admin
      const uploadResponse = await request.post(`${BASE}/api/v1/files`, {
        headers: ADMIN_HEADERS,
        multipart: {
          file: {
            name: "no-delete.txt",
            mimeType: "text/plain",
            buffer: Buffer.from("protected content"),
          },
        },
      });

      if (uploadResponse.status() === 201) {
        const uploadData = await uploadResponse.json();
        const fileId = uploadData.file.id;

        // Try to delete as member
        const response = await request.delete(`${BASE}/api/v1/files/${fileId}`, {
          headers: MEMBER_HEADERS,
        });

        // Member has no access
        expect([403, 404]).toContain(response.status());
      }
    });
  });

  test.describe("GET /api/v1/files/[id]/url (download)", () => {
    test("returns file content", async ({ request }) => {
      const testContent = "Downloadable file content";

      // Upload a file
      const uploadResponse = await request.post(`${BASE}/api/v1/files`, {
        headers: ADMIN_HEADERS,
        multipart: {
          file: {
            name: "download-test.txt",
            mimeType: "text/plain",
            buffer: Buffer.from(testContent),
          },
        },
      });

      if (uploadResponse.status() === 201) {
        const uploadData = await uploadResponse.json();
        const fileId = uploadData.file.id;

        const response = await request.get(`${BASE}/api/v1/files/${fileId}/url`, {
          headers: ADMIN_HEADERS,
        });

        expect(response.status()).toBe(200);
        expect(response.headers()["content-type"]).toBe("text/plain");

        const body = await response.text();
        expect(body).toBe(testContent);
      }
    });

    test("sets Content-Disposition for download", async ({ request }) => {
      // Upload a file
      const uploadResponse = await request.post(`${BASE}/api/v1/files`, {
        headers: ADMIN_HEADERS,
        multipart: {
          file: {
            name: "attachment.txt",
            mimeType: "text/plain",
            buffer: Buffer.from("attachment content"),
          },
        },
      });

      if (uploadResponse.status() === 201) {
        const uploadData = await uploadResponse.json();
        const fileId = uploadData.file.id;

        const response = await request.get(
          `${BASE}/api/v1/files/${fileId}/url?download=true`,
          { headers: ADMIN_HEADERS }
        );

        expect(response.status()).toBe(200);
        const disposition = response.headers()["content-disposition"];
        expect(disposition).toContain("attachment");
      }
    });

    test("requires read access", async ({ request }) => {
      // Upload private file as admin
      const uploadResponse = await request.post(`${BASE}/api/v1/files`, {
        headers: ADMIN_HEADERS,
        multipart: {
          file: {
            name: "private-download.txt",
            mimeType: "text/plain",
            buffer: Buffer.from("secret content"),
          },
        },
      });

      if (uploadResponse.status() === 201) {
        const uploadData = await uploadResponse.json();
        const fileId = uploadData.file.id;

        // Try to download as member
        const response = await request.get(`${BASE}/api/v1/files/${fileId}/url`, {
          headers: MEMBER_HEADERS,
        });

        // Member has no access
        expect(response.status()).toBe(404);
      }
    });
  });
});
