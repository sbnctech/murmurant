import fs from "node:fs/promises";
import path from "node:path";

export type EmailPayload = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

export type EmailResult = {
  messageId: string;
};

export type MockEmailEntry = {
  id: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  createdAt: string;
};

const LOG_FILE = path.join(process.cwd(), "tmp", "mock-email-log.json");

async function ensureLogFile() {
  // Make sure the tmp directory exists
  await fs.mkdir(path.dirname(LOG_FILE), { recursive: true });

  // If the log file does not exist, create an empty array
  try {
    await fs.access(LOG_FILE);
  } catch {
    await fs.writeFile(LOG_FILE, "[]", "utf-8");
  }
}

/**
 * Mock email sender for development.
 * Instead of actually sending email, it appends a record
 * to tmp/mock-email-log.json so tests and the admin UI
 * can inspect what would have been sent.
 */
export async function sendEmail(
  payload: EmailPayload,
): Promise<EmailResult> {
  await ensureLogFile();

  const now = new Date().toISOString();
  const id = `mock-${now}-${Math.random().toString(36).slice(2, 8)}`;

  const entry: MockEmailEntry = {
    id,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
    createdAt: now,
  };

  let existing: MockEmailEntry[] = [];
  try {
    const raw = await fs.readFile(LOG_FILE, "utf-8");
    existing = JSON.parse(raw) as MockEmailEntry[];
  } catch {
    existing = [];
  }

  existing.push(entry);
  await fs.writeFile(LOG_FILE, JSON.stringify(existing, null, 2), "utf-8");

  if (process.env.NODE_ENV !== "production") {
    // Helpful for local debugging
    console.log("[mock-email] sent", entry);
  }

  return { messageId: id };
}

/**
 * Helper for the admin dashboard to read recent mock emails.
 */
export async function listMockEmails(
  limit = 20,
): Promise<MockEmailEntry[]> {
  await ensureLogFile();

  try {
    const raw = await fs.readFile(LOG_FILE, "utf-8");
    const all = JSON.parse(raw) as MockEmailEntry[];
    return all.slice(-limit).reverse();
  } catch {
    return [];
  }
}
