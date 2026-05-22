// Type definitions for plan selection
// Maps to both frontend display and backend plan codes

export type MasterPlanType = "regular" | "jewelry";

export type PlanCategory = "calendar" | "visual" | "full";

export type PlanSelectionMeta = {
  master: MasterPlanType;
  category: PlanCategory;
  planName: string;
  planSlug: string;
};
