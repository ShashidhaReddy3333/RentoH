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
    },
  },
  plugins: [],
};
export default config;
