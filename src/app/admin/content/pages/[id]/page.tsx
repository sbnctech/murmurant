// Copyright (c) Santa Barbara Newcomers Club
// Page editor route - renders page title and block list
// A4: Lifecycle state passed to client for Draft/Published controls

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageContent } from "@/lib/publishing/blocks";
import {
  computeLifecycleState,
  PageStatus,
} from "@/lib/publishing/pageLifecycle";
import PageEditorClient from "./PageEditorClient";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export default async function PageEditorPage({ params }: RouteParams) {
  const { id } = await params;

  const page = await prisma.page.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      content: true,
      publishedContent: true,
      publishedAt: true,
    },
  });

  if (!page) {
    notFound();
  }

  // Extract blocks from content, sorted by order field
  const content = page.content as PageContent | null;
  const publishedContent = page.publishedContent as PageContent | null;
  const blocks = content?.blocks ?? [];
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  // Compute lifecycle state for UI
  const lifecycle = computeLifecycleState(
    page.status as PageStatus,
    page.publishedAt,
    content,
    publishedContent
  );

  return (
    <div data-test-id="page-editor-root" style={{ padding: "20px" }}>
      <div style={{ marginBottom: "16px" }}>
        <Link
          href="/admin/content/pages"
          style={{ color: "#0066cc", textDecoration: "none", fontSize: "14px" }}
        >
          &larr; Back to Pages
        </Link>
      </div>

      <h1 data-test-id="page-editor-title" style={{ fontSize: "24px", margin: "0 0 8px 0" }}>
        {page.title}
      </h1>
      <p style={{ color: "#666", margin: "0 0 24px 0", fontSize: "14px" }}>
        /{page.slug}
      </p>

      <PageEditorClient
        pageId={page.id}
        initialBlocks={sortedBlocks}
        lifecycle={lifecycle}
      />
    </div>
  );
}
