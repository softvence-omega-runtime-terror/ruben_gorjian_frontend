<<<<<<< HEAD
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["var(--font-poppins)", "sans-serif"],
        "stack-sans-notch": ["var(--font-stack-sans-notch)", "sans-serif"],
        sora: ["var(--font-sora)", "sans-serif"],
      },
      colors: {
        background: "white",
        foreground: "black",
        card: {
          DEFAULT: "white",
          foreground: "black",
        },
        popover: {
          DEFAULT: "white",
          foreground: "black",
        },
        primary: {
          DEFAULT: "#1e2248",
          foreground: "white",
        },
        secondary: {
          DEFAULT: "#55596a",
          foreground: "white",
        },
        accent: {
          DEFAULT: "#d25ffd",
          foreground: "white",
        },
        muted: {
          DEFAULT: "#f1f5f9",
          foreground: "#64748b",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "white",
        },
        border: "#e2e8f0",
        input: "#e2e8f0",
        ring: "#d25ffd",
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
      },
      backgroundImage: {
        hero: "url(/components/assets/hero-bg.png)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        glow: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.05)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s infinite",
        glow: "glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
=======
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["var(--font-poppins)", "sans-serif"],
        "stack-sans-notch": ["var(--font-stack-sans-notch)", "sans-serif"],
        sora: ["var(--font-sora)", "sans-serif"],
      },
      colors: {
        background: "white",
        foreground: "black",
        card: {
          DEFAULT: "white",
          foreground: "black",
        },
        popover: {
          DEFAULT: "white",
          foreground: "black",
        },
        primary: {
          DEFAULT: "#1e2248",
          foreground: "white",
        },
        secondary: {
          DEFAULT: "#55596a",
          foreground: "white",
        },
        accent: {
          DEFAULT: "#d25ffd",
          foreground: "white",
        },
        muted: {
          DEFAULT: "#f1f5f9",
          foreground: "#64748b",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "white",
        },
        border: "#e2e8f0",
        input: "#e2e8f0",
        ring: "#d25ffd",
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
      },
      backgroundImage: {
        hero: "url(/components/assets/hero-bg.png)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        glow: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.05)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s infinite",
        glow: "glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
>>>>>>> xerox
