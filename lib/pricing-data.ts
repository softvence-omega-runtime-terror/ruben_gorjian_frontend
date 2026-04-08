// Comprehensive pricing data structure for TaleNovaaa
// This maps the display copy to the backend plan codes

export type MasterPlanType = "regular" | "jewelry";
export type PlanCategory = "calendar" | "visual" | "full";

export interface PricingPlan {
  displayName: string;
  description: string;
  price: number;
  isTrial?: boolean;
  isPopular?: boolean;
  features: string[];
  additionalInfo?: string;
  internalCode?: string;
}

export interface PlanGroup {
  id: PlanCategory;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  positioning: string;
  features: string[];
  plans: PricingPlan[];
}

export const regularCalendarPlans: PricingPlan[] = [
  {
    displayName: "Calendar Only",
    description: "Custom",
    price: 0,
    features: ["Client schedules posts", "Unlimited posts", "1 platform included"],
    additionalInfo: "Additional platforms: per platform add-on",
    internalCode: "CO",
  },
];

export const regularVisualPlans: PricingPlan[] = [
  {
    displayName: "Visual Calendar",
    description: "Custom",
    price: 0,
    isPopular: true,
    features: [
      "Client schedules posts",
      "Up to 15 posts/mo (soft limit)",
      "1 platform included",
      "Photography visit included",
    ],
    additionalInfo: "Video add-on available",
    internalCode: "VCP-15",
  },
];

export const regularFullPlans: PricingPlan[] = [
  {
    displayName: "Full Management",
    description: "Custom",
    price: 0,
    features: ["Admin schedules posts", "Up to 20 posts/mo", "1 platform included"],
    internalCode: "FMP-20",
  },
  {
    displayName: "Full Management Plus",
    description: "Custom",
    price: 0,
    isPopular: true,
    features: ["Admin schedules posts", "Up to 35 posts/mo", "Up to 3 platforms included"],
    internalCode: "FMP-35",
  },
  {
    displayName: "Full Management Premium",
    description: "Custom",
    price: 0,
    features: ["Admin schedules posts", "Up to 70 posts/mo", "Up to 3 platforms included"],
    internalCode: "FM-70",
  },
];

export const jewelryCalendarPlans = regularCalendarPlans;
export const jewelryVisualPlans = regularVisualPlans;
export const jewelryFullPlans = regularFullPlans;

const regularPlanGroups: PlanGroup[] = [
  {
    id: "calendar",
    icon: "",
    title: "Calendar Only",
    subtitle: "Your Planning Engine",
    description:
      "Plan, organize, and schedule your social media with a clean calendar. Perfect for businesses that create their own content but need structure and scheduling.",
    positioning: "Best way to start",
    features: [
      "Client-led scheduling",
      "Unlimited posts",
      "Platform add-ons supported",
    ],
    plans: regularCalendarPlans,
  },
  {
    id: "visual",
    icon: "",
    title: "Visual Calendar",
    subtitle: "Planning + Capture",
    description:
      "Schedule your posts with a lightweight calendar and get a monthly photography visit for fresh content.",
    positioning: "Most popular",
    features: [
      "Monthly photography visit",
      "Soft post limit counter",
      "Video add-on available",
    ],
    plans: regularVisualPlans,
  },
  {
    id: "full",
    icon: "",
    title: "Full Management",
    subtitle: "Done-For-You Engine",
    description:
      "Talexia handles planning, scheduling, and publishing with admin-managed calendars and hard post limits.",
    positioning: "Best value / hands-off",
    features: [
      "Admin scheduling",
      "Hard post limits enforced",
      "Platform add-ons supported",
    ],
    plans: regularFullPlans,
  },
];

const jewelryPlanGroups: PlanGroup[] = regularPlanGroups;

export function getPlanGroupsByType(master: MasterPlanType): PlanGroup[] {
  return master === "jewelry" ? jewelryPlanGroups : regularPlanGroups;
}
