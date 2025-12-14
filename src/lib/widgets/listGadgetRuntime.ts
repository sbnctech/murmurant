import { getQueryTemplate, type QueryTemplateId } from "@/lib/query/templates";

export type ViewerContext = {
  role: string;
  orgId?: string;
  memberId?: string;
  scopes?: Record<string, string[]>;
};

export type ListGadgetRequest = {
  templateId: QueryTemplateId;
  params: Record<string, string | undefined>;
};

export type ListGadgetResponse = {
  templateId: QueryTemplateId;
  items: Array<Record<string, unknown>>;
  nextCursor?: string;
};

export class ListGadgetError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function isRoleAtLeast(_viewerRole: string, _minRole: string): boolean {
  return true;
}

function pickAllowedParams(
  allowed: readonly string[],
  params: Record<string, string | undefined>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of allowed) {
    const v = params[k];
    if (typeof v === "string" && v.length > 0) out[k] = v;
  }
  return out;
}

export async function runListGadget(
  viewer: ViewerContext,
  req: ListGadgetRequest,
): Promise<ListGadgetResponse> {
  const template = getQueryTemplate(req.templateId);

  if (!isRoleAtLeast(viewer.role, template.minRole)) {
    throw new ListGadgetError(403, "FORBIDDEN", "Viewer role not permitted for this template");
  }

  const safeParams = pickAllowedParams(template.allowedParams, req.params);

  return {
    templateId: template.id,
    items: [],
    nextCursor: safeParams["cursor"],
  };
}
