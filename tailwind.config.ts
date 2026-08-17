import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

/**
 * Design tokens per design.md §3, §4, §28, §41.
 * Restrained architectural palette: white canvas, near-black text,
 * muted gray, hairline border, and a single red accent used sparingly.
 *
 * The spacing scale starts from Tailwind's standard steps so fractional
 * utilities (`mt-1.5`, `px-2.5`) and control heights (`h-9`/`h-11` = 36/44px)
 * always compile — a curated subset previously dropped them silently.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    colors: {
      background: "rgb(var(--color-background) / <alpha-value>)",
      surface: "rgb(var(--color-surface) / <alpha-value>)",
      foreground: "rgb(var(--color-foreground) / <alpha-value>)",
      muted: "rgb(var(--color-muted) / <alpha-value>)",
      light: "rgb(var(--color-light) / <alpha-value>)",
      border: "rgb(var(--color-border) / <alpha-value>)",
      accent: "rgb(var(--color-accent) / <alpha-value>)",
      accentDark: "rgb(var(--color-accent-hover) / <alpha-value>)",
      dark: "rgb(var(--color-dark) / <alpha-value>)",
      white: "rgb(var(--color-white) / <alpha-value>)",
      transparent: "transparent",
    },
    fontFamily: {
      sans: ["var(--font-sans)"],
    },
    fontSize: {
      // editorial scale (design.md §4)
      "nav": ["12px", { lineHeight: "1.4", fontWeight: "500" }],
      "btn": ["12px", { lineHeight: "1.4", fontWeight: "600" }],
      "body-sm": ["15px", { lineHeight: "1.6" }],
      "body": ["17px", { lineHeight: "1.6" }],
      "lead": ["19px", { lineHeight: "1.55" }],
      "h3": ["22px", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "500" }],
      "h2": ["32px", { lineHeight: "1.08", letterSpacing: "-0.03em", fontWeight: "500" }],
      "h1": ["48px", { lineHeight: "1.02", letterSpacing: "-0.045em", fontWeight: "500" }],
      "display": ["64px", { lineHeight: "1.0", letterSpacing: "-0.045em", fontWeight: "500" }],
      // hero — design.md §4: oversized thin editorial headline
      "hero": ["clamp(42px, 7vw, 92px)", { lineHeight: "0.98", letterSpacing: "-0.05em", fontWeight: "400" }],
    },
    spacing: {
      ...defaultTheme.spacing,
      30: "120px", // editorial section rhythm (design.md §30)
    },
    maxWidth: {
      container: "1440px",
      none: "none",
    },
    borderRadius: {
      none: "0",
      xs: "2px",
      DEFAULT: "3px",
      md: "4px",
      full: "9999px",
    },
    boxShadow: {
      none: "none",
      menu: "var(--shadow-menu)",
      card: "var(--shadow-card)",
    },
    transitionDuration: {
      DEFAULT: "200ms",
      fast: "150ms",
      slow: "500ms",
    },
    keyframes: {
      "fade-up": {
        from: { opacity: "0", transform: "translateY(20px)" },
        to: { opacity: "1", transform: "translateY(0)" },
      },
      "fade-in": {
        from: { opacity: "0" },
        to: { opacity: "1" },
      },
      spin: {
        to: { transform: "rotate(360deg)" },
      },
    },
    animation: {
      "fade-up": "fade-up 600ms cubic-bezier(0.22, 1, 0.36, 1) both",
      "fade-in": "fade-in 500ms ease both",
      spin: "spin 1s linear infinite",
    },
  },
  plugins: [],
};

export default config;
