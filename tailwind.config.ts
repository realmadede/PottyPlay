import type { Config } from "tailwindcss";

// Tailwind v3. Page colors read CSS variables (see theme.css/globals.css) so light/dark
// switch automatically and opacity modifiers like bg-heather/20 work.
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
        heather: v("heather"),
        error: v("error"),
        hill: {
          far: v("hill-far"),
          mid: v("hill-mid"),
          near: v("hill-near"),
        },
        // Notch is the same in both themes
        notch: {
          DEFAULT: "#000000",
          surface: "#17171A",
          hover: "#26262B",
          ink: "#EDEDEF",
          muted: "#8B8B93",
          focus: "#F5C451",
          low: "#FF5A52",
          google: "#34A853",
          outlook: "#3B8CE8",
        },
        led: {
          DEFAULT: "#FFEBC9",
          warm: "#FFEBC9",
          amber: "#F5C451",
          heather: "#D9C2EC",
          rec: "#FF5A52",
        },
        // Mapped semantic brand palette for comprehensive app-wide theme alignment
        brand: {
          primary: v("heather"),
          secondary: "#F5C451",
          accent: v("ink"),
          bg: v("bg"),
          surface: v("field"),
          border: "var(--line)",
          text: {
            primary: v("ink"),
            secondary: v("muted"),
          },
          status: {
            success: "#34A853",
            error: v("error"),
            warning: "#F5C451",
          },
        },
      },
      // rgba tokens that can't be plain channels
      borderColor: {
        line: "var(--line)",
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
        "apple-ease": "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)",
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
        elevated: "0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -2px rgba(0, 0, 0, 0.03)",
      },
    },
  },
  plugins: [],
};

export default config;
