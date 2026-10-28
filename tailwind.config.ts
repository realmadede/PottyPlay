import type { Config } from "tailwindcss";

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: v("bg"),
        ink: v("ink"),
        muted: v("muted"),
        field: v("field"),
        "field-raised": v("field-raised"),
        heather: v("heather"),
        error: v("error"),
        success: v("success"),
        hill: {
          far: v("hill-far"),
          mid: v("hill-mid"),
          near: v("hill-near"),
        },
        notch: {
          DEFAULT: "#000000",
          surface: "#16191E",
          hover: "#22272E",
          ink: "#F3F4F6",
          muted: "#9CA3AF",
          focus: "#F59E0B",
          low: "#EF4444",
          google: "#34A853",
          outlook: "#3B8CE8",
        },
        led: {
          DEFAULT: "#FBBF24",
          warm: "#FFEBC9",
          amber: "#F59E0B",
          gold: "#FBBF24",
          heather: "#D9C2EC",
          rec: "#EF4444",
        },
        brand: {
          primary: "#F59E0B",
          secondary: "#FBBF24",
          accent: "#0D0F12",
          bg: v("bg"),
          surface: v("field"),
          border: "var(--line)",
          text: {
            primary: v("ink"),
            secondary: v("muted"),
          },
          status: {
            success: "#10B981",
            error: "#EF4444",
            warning: "#F59E0B",
          },
        },
      },
      borderColor: {
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
        "line-amber": "var(--line-amber)",
      },
      backgroundColor: {
        "heather-soft": "var(--heather-soft)",
      },
      ringColor: {
        notch: "var(--notch-ring)",
      },
      fontFamily: {
        sans: [
          '"Familjen Grotesk"',
          '"Segoe UI"',
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        mono: [
          '"SF Mono"',
          "ui-monospace",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      transitionTimingFunction: {
        awna: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        "apple-ease": "cubic-bezier(0.23, 1, 0.32, 1)",
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)",
        card: "0 4px 12px -2px rgba(0, 0, 0, 0.4), 0 2px 6px -1px rgba(0, 0, 0, 0.3)",
        elevated: "0 12px 28px -4px rgba(0, 0, 0, 0.5), 0 6px 12px -2px rgba(0, 0, 0, 0.4)",
        glow: "0 0 25px -5px rgba(245, 158, 11, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
