import type { KPIView } from "./types";

export const VALID_KPI_VIEWS: KPIView[] = [
  "board",
  "vp_activities",
  "vp_membership",
  "treasurer",
  "tech",
];

export function isValidKPIView(v: string): v is KPIView {
  return (VALID_KPI_VIEWS as string[]).includes(v);
}
