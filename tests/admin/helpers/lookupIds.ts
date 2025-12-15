import type { APIRequestContext } from "@playwright/test";

/** Shape of member items returned by /api/admin/members */
interface MemberItem {
  id: string;
  email?: string;
}

/** Shape of event items returned by /api/admin/events */
interface EventItem {
  id: string;
  title?: string;
}

/** Shape of registration items returned by /api/admin/registrations */
interface RegistrationItem {
  id: string;
}

/** API response with items array */
interface ListResponse<T> {
  items?: T[];
}

function extractItems<T>(data: ListResponse<T> | T[]): T[] {
  if (Array.isArray(data)) return data;
  return data?.items ?? [];
}

export async function lookupMemberIdByEmail(request: APIRequestContext, email: string): Promise<string> {
  const res = await request.get(`/api/admin/members?query=${encodeURIComponent(email)}`);
  if (!res.ok()) throw new Error(`lookupMemberIdByEmail: API failed ${res.status()}`);
  const data: ListResponse<MemberItem> | MemberItem[] = await res.json();
  const items = extractItems(data);
  const hit = items.find((m) => (m.email ?? "").toLowerCase() === email.toLowerCase());
  if (!hit?.id) throw new Error(`lookupMemberIdByEmail: member not found for ${email}`);
  return hit.id;
}

export async function lookupEventIdByTitle(request: APIRequestContext, title: string): Promise<string> {
  const res = await request.get(`/api/admin/events?query=${encodeURIComponent(title)}`);
  if (!res.ok()) throw new Error(`lookupEventIdByTitle: API failed ${res.status()}`);
  const data: ListResponse<EventItem> | EventItem[] = await res.json();
  const items = extractItems(data);
  const hit = items.find((e) => (e.title ?? "").toLowerCase().includes(title.toLowerCase()));
  if (!hit?.id) throw new Error(`lookupEventIdByTitle: event not found for ${title}`);
  return hit.id;
}

export async function lookupRegistrationId(request: APIRequestContext, opts: { memberEmail?: string; eventTitle?: string }): Promise<string> {
  const qParts: string[] = [];
  if (opts.memberEmail) qParts.push(opts.memberEmail);
  if (opts.eventTitle) qParts.push(opts.eventTitle);
  const q = qParts.join(" ").trim();
  const res = await request.get(`/api/admin/registrations?query=${encodeURIComponent(q)}`);
  if (!res.ok()) throw new Error(`lookupRegistrationId: API failed ${res.status()}`);
  const data: ListResponse<RegistrationItem> | RegistrationItem[] = await res.json();
  const items = extractItems(data);
  const hit = items[0];
  if (!hit?.id) throw new Error(`lookupRegistrationId: no registrations found for query="${q}"`);
  return hit.id;
}
