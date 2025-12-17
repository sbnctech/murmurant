// Copyright (c) Santa Barbara Newcomers Club
// Page editor route - Edit existing page

import PageEditorClient from "./PageEditorClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminPageEditorPage({ params }: PageProps) {
  const { id } = await params;

  return <PageEditorClient pageId={id} />;
}
