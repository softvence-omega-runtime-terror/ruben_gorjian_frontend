/**
 * SINGLE SOURCE OF TRUTH — Pricing Catalog for TaleNovaaa
 *
 * This file contains all plan definitions with:
 * - User-facing display data (name, price, features, CTAs)
 * - Internal lookup keys for backend mapping
 * - No internal codes/IDs are ever shown in the UI
 */

export type MasterPlanType = "regular" | "jewelry";
export type PlanCategory = "calendar" | "visual" | "full";

/** Single feature with optional tooltip for UI */
export interface PlanFeature {
  label: string;
  tooltip?: string;
}

export interface PlanDefinition {
  // User-facing fields (SHOWN IN UI)
  name: string;
  priceLabel: string;
  priceStandard: number;
  priceFounder: number;
  /** Features with optional tooltips (tooltip passed to UI tooltip component) */
  features: PlanFeature[];
  ctaLabel: string;
  isFeatured: boolean;
  positioningTag?: string;
  trialDays: number;

  // Internal fields (NEVER SHOWN IN UI)
  lookupKey: string;
  requiresPayment: boolean;

  // Additional metadata
  additionalInfo?: string;
}

export interface PlanCategoryDefinition {
  master: MasterPlanType;
  category: PlanCategory;
  plans: PlanDefinition[];
}

// ============================================================================
// REGULAR BUSINESS PLANS
// ============================================================================

const regularFullPlans: PlanDefinition[] = [
  {
    name: "Full Management",
    priceLabel: "$395/mo",
    priceStandard: 395,
    priceFounder: 276.5,
    features: [
      {
        label: "We handle all posting",
        tooltip:
          "Done-For-You Posting: Talexia handles all scheduling and publishing across your connected platform.",
      },
      {
        label: "Up to 12 posts/month",
        tooltip:
          "Standard Posting Volume. Structured plan supporting up to 12 posts per month using your refreshed visual content.",
      },
      {
        label: "Pro Photo Shoot (Every 3 months)",
        tooltip:
          "Efficiency Production. A professional photo session conducted every 3 months to refresh your visual library. This is a streamlined, 60-minute session.",
      },
      {
        label: "We write captions & hashtags",
        tooltip:
          "Strategic AI Copywriting. Includes professionally written captions and optimized hashtags tailored to your brand voice and positioning.",
      },
      {
        label: "1 platform included (+$5/mo per extra)",
        tooltip: "",
      },
      {
        label: "Video add-ons available",
        tooltip:
          "Video Add-On: Professional vertical reel production available as an add-on. Video Starting from $495/hr; pricing and scope depend on session requirements.",
      },
    ],
    ctaLabel: "Choose Plan",
    isFeatured: false,
    trialDays: 0,
    lookupKey: "FMP-20",
    requiresPayment: true,
  },
  {
    name: "Full Management Plus",
    priceLabel: "$495/mo",
    priceStandard: 495,
    priceFounder: 346.5,
    features: [
      {
        label: "We handle all posting",
        tooltip:
          "Done-For-You Posting: Talexia handles all scheduling and publishing across your connected platform.",
      },
      {
        label: "Up to 16 posts/month",
        tooltip:
          "High Posting Volume. Managed publishing for up to 16 posts per month across selected platforms.",
      },
      {
        label: "2 platforms included (Instagram & Facebook)",
        tooltip: "",
      },
      {
        label: "Pro Photo Shoot (Every 2 months)",
        tooltip:
          "Increased Production Frequency. Professional photo sessions every 2 months to maintain higher posting volume and visual freshness.",
      },
      {
        label: "We write captions & hashtags",
        tooltip:
          "Strategic AI Copywriting. Includes professionally written captions and optimized hashtags tailored to your brand voice and positioning.",
      },
      {
        label: "Video add-ons available",
        tooltip:
          "Video Add-On: Professional vertical reel production available as an add-on. Video Starting from $495/hr; pricing and scope depend on session requirements.",
      },
    ],
    ctaLabel: "Choose Plan",
    isFeatured: true,
    positioningTag: "Most popular",
    trialDays: 0,
    lookupKey: "FMP-35",
    requiresPayment: true,
  },
  {
    name: "Full Management Premium",
    priceLabel: "$949/mo",
    priceStandard: 949,
    priceFounder: 664.3,
    features: [
      {
        label: "We handle all posting",
        tooltip:
          "Done-For-You Posting: Talexia handles scheduling and publishing across your connected platforms.",
      },
      {
        label: "Up to 20 posts/month",
        tooltip:
          "Maximum Posting Volume: Strategic management and publishing for up to 20 posts per month.",
      },
      {
        label: "3 platforms included (Instagram, Facebook & TikTok)",
        tooltip: "",
      },
      {
        label: "Video: 1 Full Reel + 3 Micro-Reels (Reels/TikToks)",
        tooltip:
          'Hybrid Video Package: Includes 1 Cinematic Edited Reel plus 3 "Story Loops" (Micro-Reels) designed for daily engagement. Starting from $495/hr; pricing and scope depend on session requirements.',
      },
      {
        label: "Pro Photo Shoot (Every month)",
        tooltip:
          "Maximum Production Frequency. Professional photo sessions every month to maintain highest posting volume and visual freshness.",
      },
      {
        label: "We write captions & hashtags",
        tooltip:
          "Strategic Copywriting: Professionally written captions and optimized hashtags aligned with your brand positioning.",
      },
    ],
    ctaLabel: "Choose Plan",
    isFeatured: false,
    trialDays: 0,
    lookupKey: "FM-70",
    requiresPayment: true,
  },
];

// Reuse regular plans for jewelry until jewelry-specific plans are defined
const jewelryFullPlans = regularFullPlans;

// ============================================================================
// PRICING CATALOG (Single Source of Truth)
// Calendar Only and Visual Calendar plans removed; only Full Management offered.
// ============================================================================

export const pricingCatalog: PlanCategoryDefinition[] = [
  { master: "regular", category: "full", plans: regularFullPlans },
  { master: "jewelry", category: "full", plans: jewelryFullPlans },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getPlansForCategory(
  master: MasterPlanType,
  category: PlanCategory
): PlanDefinition[] {
  const catalog = pricingCatalog.find(
    (c) => c.master === master && c.category === category
  );
  return catalog?.plans || [];
}

export function getPlanByLookupKey(lookupKey: string): PlanDefinition | null {
  for (const catalog of pricingCatalog) {
    const plan = catalog.plans.find((p) => p.lookupKey === lookupKey);
    if (plan) return plan;
  }
  return null;
}

export function getCategoryDisplayName(category: PlanCategory): string {
  const map: Record<PlanCategory, string> = {
    calendar: "Calendar Only",
    visual: "Visual Calendar",
    full: "Full Management",
  };
  return map[category] ?? "Full Management";
}

/** Plan codes that represent the top tier (no "Upgrade" CTA shown). */
export const HIGHEST_PLAN_LOOKUP_KEYS: string[] = ["FM-70"];

export function isOnHighestPlan(planCode: string | undefined | null): boolean {
  if (!planCode) return false;
  return HIGHEST_PLAN_LOOKUP_KEYS.includes(planCode);
}
