import { type QueryTemplateId } from "@/lib/query/templates";

export type ChatIntent =
  | { type: "HOW_TO"; topic: string }
  | { type: "QUERY"; templateId: QueryTemplateId; params?: Record<string, string> }
  | { type: "DEEPLINK"; url: string };

export type ChatResponse =
  | { kind: "TEXT"; text: string }
  | { kind: "LIST"; templateId: QueryTemplateId; title: string }
  | { kind: "DEEPLINK"; label: string; url: string };

export function routeChatMessage(message: string): ChatIntent {
  const m = message.trim().toLowerCase();

  if (m.includes("upcoming events")) return { type: "QUERY", templateId: "EVT_UPCOMING_MEMBER" };
  if (m.includes("my registrations")) return { type: "QUERY", templateId: "REG_MY_UPCOMING" };
  if (m.includes("member directory")) return { type: "QUERY", templateId: "MEM_DIRECTORY_MEMBER" };

  return { type: "HOW_TO", topic: message.trim() };
}

export function renderIntent(intent: ChatIntent): ChatResponse {
  if (intent.type === "HOW_TO") {
    return { kind: "TEXT", text: `I can help with that. What are you trying to accomplish in the app?` };
  }
  if (intent.type === "QUERY") {
    return { kind: "LIST", templateId: intent.templateId, title: "Here is what I found" };
  }
  return { kind: "DEEPLINK", label: "Open", url: intent.url };
}
