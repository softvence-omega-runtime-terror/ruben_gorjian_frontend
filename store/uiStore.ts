import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { MasterPlanType, PlanCategory } from "@/lib/pricing-config";

type CalendarView = "day" | "week" | "month";

type PlanSelectionMeta = {
  master: MasterPlanType;
  category: PlanCategory;
  planName: string;
  planSlug: string;
};

type UiState = {
  selectedPlanId: string | null;
  setSelectedPlanId: (planId: string | null) => void;
  selectedPlanMeta: PlanSelectionMeta | null;
  setSelectedPlanMeta: (meta: PlanSelectionMeta | null) => void;
  onboardingStep: number;
  setOnboardingStep: (step: number) => void;
  calendarView: CalendarView;
  setCalendarView: (view: CalendarView) => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      selectedPlanId: null,
      setSelectedPlanId: (planId) => set({ selectedPlanId: planId }),
      selectedPlanMeta: null,
      setSelectedPlanMeta: (meta) => set({ selectedPlanMeta: meta }),
      onboardingStep: 1,
      setOnboardingStep: (step) => set({ onboardingStep: step }),
      calendarView: "month",
      setCalendarView: (view) => set({ calendarView: view }),
    }),
    {
      name: "talexia-ui-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedPlanId: state.selectedPlanId,
        selectedPlanMeta: state.selectedPlanMeta,
        calendarView: state.calendarView,
      }),
    }
  )
);
