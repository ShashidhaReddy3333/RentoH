import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx,js,jsx,mdx}", "./components/**/*.{ts,tsx,js,jsx,mdx}", "./lib/**/*.{ts,tsx,js,jsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: "var(--brand-teal)",
          blue: "var(--brand-blue)",
          green: "var(--brand-green)",
          yellow: "var(--brand-yellow)",
          dark: "var(--brand-dark)",
          bg: "var(--brand-bg)",
        },
        textc: "rgb(var(--color-text-primary) / <alpha-value>)",
        "text-muted": "rgb(var(--color-text-muted) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        "surface-muted": "rgb(var(--color-surface-muted) / <alpha-value>)",
      },
      borderRadius: { card: "var(--radius-card)" },
      maxWidth: { container: "var(--container)" },
      spacing: { section: "var(--section-y)" },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      fontSize: {
        h1: ["48px", { lineHeight: "56px", fontWeight: "800" }],
        h2: ["36px", { lineHeight: "44px", fontWeight: "700" }],
        h3: ["28px", { lineHeight: "36px", fontWeight: "700" }],
        body: ["16px", { lineHeight: "26px", fontWeight: "400" }],
      },
      boxShadow: {
        soft: "0 18px 36px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
