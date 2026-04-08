export type PlanStatus = "ACTIVE" | "TRIALING" | "CANCELED" | "INCOMPLETE" | "PAST_DUE";

export type Plan = {
  id: string;
  name: string;
  code?: string;
  price: number;
  currency: string;
  interval: "month" | "year";
  /** When the current period ends (renewal date). Prefer this over renewsAt when present. */
  current_period_end?: string | number | null;
  renewsAt?: string | null;
  status: PlanStatus;
  priceType?: "STANDARD" | "FOUNDER";
  platformLimit?: number | null;
  addonPlatformQty?: number;
  videoAddonEnabled?: boolean;
  postLimitType?: "NONE" | "SOFT" | "HARD";
  schedulerRole?: "CLIENT" | "ADMIN";
  visualQuota?: number | null;
  postQuota?: number | null;
  usage?: {
    postsUsed: number;
    visualsUsed: number;
    platformsUsed: number;
  };
  scheduledChange?: {
    targetPlanCode: string;
    targetBillingCycle: "monthly" | "yearly";
    effectiveAt: string;
    message?: string;
    scheduleId?: string;
  } | null;
  cancelAtPeriodEnd?: boolean;
};

export type InvoiceStatus = "paid" | "open" | "void" | "uncollectible";

export type Invoice = {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  hostedInvoiceUrl?: string | null;
  createdAt: string;
};
