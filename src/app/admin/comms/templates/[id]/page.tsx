/**
 * Edit Message Template Page
 *
 * P1.1: Message Template Editor UI
 *
 * Copyright (c) Murmurant, Inc.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TemplateEditor from "../TemplateEditor";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditTemplatePage({ params }: Props) {
  const { id } = await params;

  const template = await prisma.messageTemplate.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      subject: true,
      bodyHtml: true,
      bodyText: true,
      isActive: true,
    },
  });

  if (!template) {
    notFound();
  }

  return (
    <div data-test-id="admin-template-edit" style={{ padding: "20px" }}>
      <div style={{ marginBottom: "20px" }}>
        <Link
          href="/admin/comms/templates"
          style={{ color: "#2563eb", fontSize: "14px", textDecoration: "none" }}
        >
          &larr; Back to templates
        </Link>
      </div>
      <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "20px" }}>
        Edit Template: {template.name}
      </h1>
      <TemplateEditor
        templateId={template.id}
        initialData={{
          name: template.name,
          slug: template.slug,
          subject: template.subject,
          bodyHtml: template.bodyHtml,
          bodyText: template.bodyText || undefined,
          isActive: template.isActive,
        }}
      />
    </div>
  );
}
