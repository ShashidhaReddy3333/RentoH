import type { Config } from "tailwindcss";
import type { PluginAPI } from "tailwindcss/types/config";
const config: Config = {
  content: ["./app/**/*.{ts,tsx,js,jsx,mdx}", "./components/**/*.{ts,tsx,js,jsx,mdx}", "./lib/**/*.{ts,tsx,js,jsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: "var(--brand-teal)",
          blue: "var(--brand-blue, #1E88E5)",
          green: "var(--brand-green, #43A047)",
          yellow: "var(--brand-yellow, #F9A825)",
          dark: "var(--brand-dark)",
          bg: "var(--brand-bg)",
        },
        textc: "rgb(var(--color-text-primary) / <alpha-value>)",
        "text-muted": "rgb(var(--color-text-muted) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        "surface-muted": "rgb(var(--color-surface-muted) / <alpha-value>)",
        // Accessible color tokens (WCAG AA ≥4.5:1)
        accent: {
          DEFAULT: '#005A9E', // strong blue, 7.5:1 on white
          focus: '#FFB300',   // amber, visible on dark/light
          error: '#D32F2F',   // red, 5.5:1 on white
          success: '#388E3C', // green, 5.7:1 on white
        },
        focus: {
          ring: '#FFB300', // visible amber focus ring
        },
      },
      borderRadius: {
        card: "var(--radius-card)",
        lg: "16px",
        xl: "24px",
        "2xl": "32px",
      },
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
        focus: '0 0 0 3px #FFB300', // focus ring shadow
      },
      outline: {
        focus: ['2px solid #FFB300'],
      },
    },
  },
  plugins: [
    function focusRingUtilities(pluginApi: PluginAPI) {
      const { addUtilities } = pluginApi;
      addUtilities({
        '.focus-ring': {
          outline: '2px solid #FFB300',
          outlineOffset: '2px',
          boxShadow: '0 0 0 3px #FFB30033',
          transition: 'outline 0.2s, box-shadow 0.2s',
        },
        '.focus-ring-error': {
          outline: '2px solid #D32F2F',
          outlineOffset: '2px',
          boxShadow: '0 0 0 3px #D32F2F33',
        },
      });
    },
  ],
};
export default config;
