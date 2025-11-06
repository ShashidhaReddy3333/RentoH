import type { Config } from "tailwindcss";

const withOpacity = (variable: string) => `hsl(var(${variable}) / <alpha-value>)`;

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
          bg: withOpacity("--color-brand-bg"),
          light: withOpacity("--color-brand-light"),
          dark: withOpacity("--color-brand-dark"),
          primary: withOpacity("--color-brand-primary"),
          primaryStrong: withOpacity("--color-brand-primary-strong"),
          primaryMuted: withOpacity("--color-brand-primary-muted"),
          success: withOpacity("--color-brand-success"),
          successMuted: withOpacity("--color-brand-success-muted"),
          warning: withOpacity("--color-brand-warning"),
          warningMuted: withOpacity("--color-brand-warning-muted"),
          teal: withOpacity("--color-brand-teal"),
          blue: withOpacity("--color-brand-blue"),
          green: withOpacity("--color-brand-green"),
          outline: withOpacity("--color-brand-outline")
        },
        surface: withOpacity("--color-surface"),
        "surface-muted": withOpacity("--color-surface-muted"),
        textc: withOpacity("--color-textc"),
        text: {
          muted: withOpacity("--color-text-muted")
        },
        ink: {
          DEFAULT: withOpacity("--color-ink"),
          muted: withOpacity("--color-ink-muted")
        },
        neutral: {
          50: withOpacity("--color-neutral-50"),
          100: withOpacity("--color-neutral-100"),
          200: withOpacity("--color-neutral-200"),
          300: withOpacity("--color-neutral-300"),
          400: withOpacity("--color-neutral-400"),
          500: withOpacity("--color-neutral-500"),
          600: withOpacity("--color-neutral-600"),
          700: withOpacity("--color-neutral-700"),
          800: withOpacity("--color-neutral-800"),
          900: withOpacity("--color-neutral-900")
        },
        danger: {
          DEFAULT: withOpacity("--color-danger"),
          muted: withOpacity("--color-danger-muted")
        },
        outline: withOpacity("--color-brand-outline")
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
