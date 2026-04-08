/**
 * Pricing comparison: 3 Full Management plans, feature matrix.
 * Single source of truth for the comparison table UI.
 * Calendar Only and Visual Calendar plans removed.
 */

export const PLAN_KEYS = ["FMP-20", "FMP-35", "FM-70"] as const;
export type PlanKey = (typeof PLAN_KEYS)[number];

export const PLAN_NAMES: Record<PlanKey, string> = {
  "FMP-20": "Full Mgmt",
  "FMP-35": "Full Mgmt Plus",
  "FM-70": "Full Mgmt Premium",
};

export const MONTHLY_PRICES: Record<PlanKey, number> = {
  "FMP-20": 395,
  "FMP-35": 495,
  "FM-70": 949,
};

/** Cell value: "yes" = ✓, "no" = ✗, "client" = Client (blue), "admin" = ◇ Talexia, or custom text */
export type CellValue = "yes" | "no" | "client" | "admin" | string;

export interface ComparisonRow {
  category: string;
  values: Record<PlanKey, CellValue>;
}

export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    category: "Plan Type",
    values: {
      "FMP-20": "Full Mgmt",
      "FMP-35": "Full Mgmt Plus",
      "FM-70": "Full Mgmt Premium",
    },
  },
  {
    category: "Monthly Price",
    values: {
      "FMP-20": "$395",
      "FMP-35": "$495",
      "FM-70": "$949",
    },
  },
  {
    category: "Description",
    values: {
      "FMP-20":
        "Quarterly professional photography + fully managed posting. Talexia creates visuals, writes captions, and schedules posts for you.",
      "FMP-35":
        "Professional photo session every 2 months + higher posting volume. Talexia manages visuals, captions, and publishing across multiple platforms.",
      "FM-70":
        "Monthly on-site professional production with priority creative direction. Talexia handles visuals, strategy, captions, and execution.",
    },
  },
  {
    category: "Best for",
    values: {
      "FMP-20": "Established businesses that want consistent professional content without managing it internally.",
      "FMP-35": "Growing restaurants with larger menus or multi-platform presence that require stronger content cadence.",
      "FM-70": "Established operators who value high-end visuals and want an ongoing creative partner, not a vendor.",
    },
  },
  {
    category: "Posts / Month",
    values: {
      "FMP-20": "Up to 12",
      "FMP-35": "Up to 16",
      "FM-70": "Up to 20",
    },
  },
  {
    category: "Who Publishes",
    values: {
      "FMP-20": "admin",
      "FMP-35": "admin",
      "FM-70": "admin",
    },
  },
  {
    category: "Platforms Included",
    values: {
      "FMP-20": "1 (+$5/mo per extra)",
      "FMP-35": "2 (Instagram & Facebook)",
      "FM-70": "3 (Instagram, Facebook & TikTok)",
    },
  },
  {
    category: "Add'l Platforms (each)",
    values: {
      "FMP-20": "$5",
      "FMP-35": "$5",
      "FM-70": "$5",
    },
  },
  {
    category: "Content Calendar",
    values: { "FMP-20": "yes", "FMP-35": "yes", "FM-70": "yes" },
  },
  {
    category: "Scheduling and Posting",
    values: {
      "FMP-20": "yes",
      "FMP-35": "yes",
      "FM-70": "yes",
    },
  },
  {
    category: "Captions",
    values: {
      "FMP-20": "yes",
      "FMP-35": "yes",
      "FM-70": "yes",
    },
  },
  {
    category: "Hashtags",
    values: {
      "FMP-20": "yes",
      "FMP-35": "yes",
      "FM-70": "yes",
    },
  },
  {
    category: "Pro Photo Shoot",
    values: {
      "FMP-20": "Every 3 months",
      "FMP-35": "Every 2 months",
      "FM-70": "Every month",
    },
  },
  {
    category: "Visual Visit Duration",
    values: {
      "FMP-20": "1 hr",
      "FMP-35": "1.5 hrs",
      "FM-70": "2 hrs",
    },
  },
  {
    category: "PRO Photography",
    values: {
      "FMP-20": "yes",
      "FMP-35": "yes",
      "FM-70": "yes",
    },
  },
  {
    category: "PRO Videography (1 vertical · 15-20s · 1 dish)",
    values: {
      "FMP-20": "$495 + 1 Hr",
      "FMP-35": "$495 + 1 Hr",
      "FM-70": "$495 + 1 Hr",
    },
  },
  {
    category: "Creative Direction",
    values: {
      "FMP-20": "admin",
      "FMP-35": "admin",
      "FM-70": "admin",
    },
  },
  {
    category: "Revisions",
    values: {
      "FMP-20": "1",
      "FMP-35": "1",
      "FM-70": "2",
    },
  },
];

export const COMPARISON_FOOTER = "All Plans include Talexia Creative Direction";
