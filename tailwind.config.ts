import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx,js,jsx,mdx}",
    "./components/**/*.{ts,tsx,js,jsx,mdx}",
    "./lib/**/*.{ts,tsx,js,jsx,mdx}"
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.5rem",
        md: "1.5rem",
        lg: "2rem",
        xl: "2.5rem",
        "2xl": "3rem"
      }
    },
    extend: {
      colors: {
        brand: {
          primary: "#1E88E5",
          primaryStrong: "#1664C0",
          primaryMuted: "#E3F2FD",
          success: "#43A047",
          successMuted: "#E6F4EA",
          warning: "#F9A825",
          warningMuted: "#FFF2CC",
          dark: "#212121",
          light: "#F5F5F5",
          surface: "#FFFFFF",
          outline: "#D5D8DC"
        },
        neutral: {
          50: "#F5F5F5",
          100: "#E0E0E0",
          200: "#C2C2C2",
          300: "#A3A3A3",
          400: "#7C7C7C",
          500: "#5C5C5C",
          600: "#424242",
          700: "#2E2E2E",
          800: "#1F1F1F",
          900: "#141414"
        },
        danger: {
          DEFAULT: "#C62828",
          muted: "#FBE9E7"
        }
      },
      borderRadius: {
        xs: "0.375rem",
        sm: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.25rem",
        "2xl": "1.75rem",
        "3xl": "2rem"
      },
      boxShadow: {
        sm: "0 6px 18px rgba(17, 24, 39, 0.08)",
        md: "0 12px 28px rgba(17, 24, 39, 0.12)",
        lg: "0 18px 40px rgba(17, 24, 39, 0.16)"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "-apple-system", "sans-serif"]
      },
      fontSize: {
        h1: ["1.875rem", { lineHeight: "2.5rem", fontWeight: "700" }],
        h2: ["1.5rem", { lineHeight: "2.125rem", fontWeight: "600" }],
        h3: ["1.25rem", { lineHeight: "1.875rem", fontWeight: "600" }],
        body: ["1rem", { lineHeight: "1.7rem", fontWeight: "400" }],
        caption: ["0.875rem", { lineHeight: "1.4rem", fontWeight: "500" }]
      },
      spacing: {
        section: "3.5rem"
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.16, 1, 0.3, 1)"
      }
    }
  },
  plugins: [
    function focusUtilities({
      addUtilities
    }: {
      addUtilities: (utilities: Record<string, Record<string, string>>) => void;
    }) {
      addUtilities({
        ".focus-ring": {
          outline: "none",
          boxShadow: "0 0 0 4px rgba(30, 136, 229, 0.25)"
        },
        ".focus-ring-inset": {
          outline: "none",
          boxShadow: "inset 0 0 0 2px rgba(30, 136, 229, 0.35)"
        }
      });
    }
  ]
};

export default config;
