/**
 * Create New Message Template Page
 *
 * P1.1: Message Template Editor UI
 *
 * Copyright (c) Murmurant, Inc.
 */

import Link from "next/link";
import TemplateEditor from "../TemplateEditor";

export default function NewTemplatePage() {
  return (
    <div data-test-id="admin-template-new" style={{ padding: "20px" }}>
      <div style={{ marginBottom: "20px" }}>
        <Link
          href="/admin/comms/templates"
          style={{ color: "#2563eb", fontSize: "14px", textDecoration: "none" }}
        >
          &larr; Back to templates
        </Link>
      </div>
      <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "20px" }}>
        Create Message Template
      </h1>
      <TemplateEditor />
    </div>
  );
}
