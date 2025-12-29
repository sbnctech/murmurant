// Copyright (c) Murmurant, Inc.
// JSON-LD script tag component for SEO
// P2: Emit JSON-LD for public pages

import { serializeJsonLd } from "@/lib/seo/jsonld";

type JsonLdProps = {
  data: object;
};

/**
 * Renders a JSON-LD script tag for structured data
 * Only renders if data is non-empty
 */
export function JsonLd({ data }: JsonLdProps) {
  const serialized = serializeJsonLd(data);

  if (!serialized) {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serialized }}
    />
  );
}

export default JsonLd;
