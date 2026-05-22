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
    },
  },
  plugins: [],
};

export default config;
