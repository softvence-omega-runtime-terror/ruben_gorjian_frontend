// Master Plan Categories for initial selection
// This defines the 3 top-level categories users choose from first

export type CategorySlug = "calendar" | "visual" | "full";

export interface PlanCategory {
  slug: CategorySlug;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  positioning: string;
  features: string[];
}

// Regular Business Categories
export const regularCategories: PlanCategory[] = [
  {
    slug: "calendar",
    icon: "",
    title: "Calendar Only",
    subtitle: "Your Planning Engine",
    description:
      "Plan, organize, and schedule your social media with a clean calendar. Perfect for businesses that create their own content but need structure and scheduling.",
    positioning: "Best way to start",
    features: [
      "Intuitive calendar interface",
      "Schedule posts in advance",
      "Connect multiple platforms",
      "Automated publishing",
      "Drag-and-drop planning",
    ],
  },
  {
    slug: "visual",
    icon: "",
    title: "Visual Calendar",
    subtitle: "Planning + Capture",
    description:
      "Schedule your posts with a lightweight calendar and get a monthly photography visit for fresh content.",
    positioning: "Most popular",
    features: [
      "Client-led scheduling",
      "Monthly photography visit",
      "Soft post limit counter",
      "Video add-on available",
      "Platform add-ons supported",
    ],
  },
  {
    slug: "full",
    icon: "",
    title: "Full Management",
    subtitle: "Done-For-You Engine",
    description:
      "Talexia handles everything: planning, AI visuals, captions, hashtags, scheduling, and publishing—plus monthly optimization. Your complete social media department.",
    positioning: "Best value / hands-off",
    features: [
      "Complete hands-off service",
      "AI visuals + captions + hashtags",
      "Strategic planning included",
      "Automated scheduling & posting",
      "Monthly performance optimization",
    ],
  },
];

// Jewelry Brand Categories
export const jewelryCategories: PlanCategory[] = [
  {
    slug: "calendar",
    icon: "💎",
    title: "Calendar Only",
    subtitle: "Your Jewelry Planning Engine",
    description:
      "Plan, organize, and schedule your jewelry collection launches with a clean calendar. Perfect for jewelry brands that create their own content but need structure and scheduling.",
    positioning: "Best way to start",
    features: [
      "Intuitive calendar interface",
      "Schedule collection reveals",
      "Connect multiple platforms",
      "Automated publishing",
      "Drag-and-drop planning",
    ],
  },
  {
    slug: "visual",
    icon: "💎💎",
    title: "Visual Calendar",
    subtitle: "Planning + Capture",
    description:
      "Schedule your posts with a lightweight calendar and get a monthly photography visit for fresh content.",
    positioning: "Most popular",
    features: [
      "Client-led scheduling",
      "Monthly photography visit",
      "Soft post limit counter",
      "Video add-on available",
      "Platform add-ons supported",
    ],
  },
  {
    slug: "full",
    icon: "💎💎💎",
    title: "Full Management",
    subtitle: "Done-For-You Jewelry Engine",
    description:
      "Talexia handles everything for your jewelry brand: planning, AI-enhanced visuals, crafted captions, hashtags, scheduling, and publishing—plus monthly optimization tailored to jewelry marketing.",
    positioning: "Best value / hands-off",
    features: [
      "Complete hands-off service",
      "Jewelry-focused AI visuals + captions",
      "Strategic jewelry marketing planning",
      "Automated scheduling & posting",
      "Monthly jewelry performance optimization",
    ],
  },
];

// Backwards compatibility - use regular categories as default
export const planCategories: PlanCategory[] = regularCategories;

export function getCategoryBySlug(slug: string): PlanCategory | undefined {
  return planCategories.find((cat) => cat.slug === slug);
}
