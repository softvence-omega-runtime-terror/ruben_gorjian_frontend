import type { MasterPlanType, PlanCategory } from "@/lib/pricing-config";
import { useUiStore } from "@/store/uiStore";

export type PlanSelectionMeta = {
  master: MasterPlanType;
  category: PlanCategory;
  planName: string;
  planSlug: string;
};

export type PlanSelection = {
  planCode: string | null;
  meta?: PlanSelectionMeta | null;
};

/**
 * Store selected plan in the UI store (persisted).
 */
export function persistPlanSelection(
  planCode: string,
  meta?: PlanSelectionMeta
): void {
  if (typeof window === "undefined") return;
  useUiStore.setState({
    selectedPlanId: planCode,
    selectedPlanMeta: meta ?? null,
  });
}

/**
 * Retrieve plan selection from the UI store or query params
 * Returns null if no valid selection found
 */
export function getPlanSelection(
  searchParams?: URLSearchParams | null
): PlanSelection | null {
  if (typeof window !== "undefined") {
    const selectedPlanId = useUiStore.getState().selectedPlanId;
    const selectedPlanMeta = useUiStore.getState().selectedPlanMeta;
    if (selectedPlanId) {
      return { planCode: selectedPlanId, meta: selectedPlanMeta };
    }
  }

  // Fallback to query params
  if (searchParams) {
    const planCode = searchParams.get("plan");
    if (planCode) {
      if (planCode === planCode.toLowerCase()) {
        return null;
      }
      if (typeof window !== "undefined") {
        useUiStore.setState({ selectedPlanId: planCode });
      }
      return { planCode };
    }
  }

  return null;
}

/**
 * Clear plan selection from the UI store
 */
export function clearPlanSelection(): void {
  if (typeof window === "undefined") return;
  useUiStore.setState({ selectedPlanId: null, selectedPlanMeta: null });
}

/**
 * Get plan code from selection (for backward compatibility)
 */
export function getSelectedPlanCode(
  searchParams?: URLSearchParams | null
): string | null {
  const selection = getPlanSelection(searchParams);
  return selection?.planCode || null;
}
