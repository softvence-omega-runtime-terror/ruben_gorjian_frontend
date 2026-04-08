// Design System Constants for TaleNovaaa
// Use these throughout the app for consistency

export const spacing = {
  // Container padding
  containerPx: "px-4 sm:px-6 lg:px-8",
  containerPy: "py-8 sm:py-12 lg:py-16",
  
  // Section spacing
  sectionGap: "space-y-6 sm:space-y-8",
  
  // Card padding
  cardPadding: "p-4 sm:p-6",
  cardGap: "gap-4 sm:gap-6",
  
  // Component spacing
  componentGap: "gap-3 sm:gap-4",
  smallGap: "gap-2 sm:gap-3",
} as const;

export const layout = {
  // Max widths
  maxWidthSm: "max-w-2xl",
  maxWidthMd: "max-w-4xl",
  maxWidthLg: "max-w-6xl",
  maxWidthXl: "max-w-7xl",
  
  // Dashboard grid
  dashboardGrid: "grid grid-cols-1 lg:grid-cols-[240px,1fr]",
  dashboardGap: "gap-4 sm:gap-6",
  
  // Content grid
  contentGrid2: "grid grid-cols-1 sm:grid-cols-2",
  contentGrid3: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  contentGrid4: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
} as const;

export const typography = {
  // Headings
  h1: "text-3xl sm:text-4xl lg:text-5xl font-bold",
  h2: "text-2xl sm:text-3xl lg:text-4xl font-semibold",
  h3: "text-xl sm:text-2xl font-semibold",
  h4: "text-lg sm:text-xl font-semibold",
  
  // Body text
  body: "text-sm sm:text-base",
  bodyLarge: "text-base sm:text-lg",
  small: "text-xs sm:text-sm",
  
  // Labels
  label: "text-xs uppercase tracking-wide font-medium",
} as const;

export const components = {
  // Cards
  card: "rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900/60 shadow",
  cardHover: "rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900/60 shadow hover:border-lime-300/40 transition",
  
  // Buttons
  buttonPrimary: "rounded-full bg-lime-400 px-4 sm:px-6 py-2 sm:py-3 text-sm font-semibold text-slate-950 hover:bg-lime-300 transition",
  buttonSecondary: "rounded-full border border-slate-700 px-4 sm:px-6 py-2 sm:py-3 text-sm font-semibold text-slate-100 hover:bg-slate-800/70 transition",
  
  // Inputs
  input: "w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400",
  
  // Navigation
  navLink: "flex items-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl px-3 py-2 text-sm border transition",
  navLinkActive: "bg-lime-300/15 text-white border-lime-300/60",
  navLinkInactive: "text-slate-200 hover:bg-slate-800/80 hover:text-white border-transparent hover:border-lime-300/40",
} as const;

export const colors = {
  // Background gradients
  bgGradient: "bg-gradient-to-br from-indigo-950 via-slate-950 to-slate-900",
  bgGradientAlt: "bg-gradient-to-b from-indigo-950 to-slate-950",
  
  // Text colors
  textPrimary: "text-white",
  textSecondary: "text-slate-300",
  textMuted: "text-slate-400",
  textAccent: "text-lime-400",
  
  // Border colors
  borderDefault: "border-slate-800",
  borderAccent: "border-lime-300/40",
} as const;

// Utility function to combine classes
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
