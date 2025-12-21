/**
 * Internal API Documentation Page
 *
 * Renders the OpenAPI specification using Swagger UI.
 * Admin-protected page for internal developer documentation.
 *
 * This page uses Swagger UI via CDN for simplicity.
 * It fetches the spec from /api/openapi.json (also admin-protected).
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { Metadata } from "next";
import ApiDocsClient from "./ApiDocsClient";

export const metadata: Metadata = {
  title: "API Documentation | ClubOS Dev",
  description: "Internal API documentation for ClubOS developers",
  robots: "noindex, nofollow", // Do not index this page
};

export default function ApiDocsPage() {
  return <ApiDocsClient />;
}
