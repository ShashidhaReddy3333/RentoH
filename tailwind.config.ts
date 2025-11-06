import type { Config } from "tailwindcss";

import { radii, shadows, spacing, typography } from "./design-system/tokens";

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
        DEFAULT: spacing.md,
        md: spacing.md,
        lg: "2rem",
        xl: "2.5rem",
        "2xl": spacing.section
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
        xs: radii.xs,
        sm: radii.sm,
        md: radii.md,
        lg: radii.lg,
        xl: radii.xl,
        "2xl": radii.xxl,
        "3xl": radii.threeXl
      },
      boxShadow: {
        sm: shadows.sm,
        md: shadows.md,
        lg: shadows.lg
      },
      fontFamily: {
        sans: [typography.fontFamily.sans]
      },
      fontSize: {
        h1: [typography.fontSize.h1.size, { lineHeight: typography.fontSize.h1.lineHeight, fontWeight: typography.fontSize.h1.weight }],
        h2: [typography.fontSize.h2.size, { lineHeight: typography.fontSize.h2.lineHeight, fontWeight: typography.fontSize.h2.weight }],
        h3: [typography.fontSize.h3.size, { lineHeight: typography.fontSize.h3.lineHeight, fontWeight: typography.fontSize.h3.weight }],
        body: [typography.fontSize.body.size, { lineHeight: typography.fontSize.body.lineHeight, fontWeight: typography.fontSize.body.weight }],
        caption: [typography.fontSize.caption.size, { lineHeight: typography.fontSize.caption.lineHeight, fontWeight: typography.fontSize.caption.weight }]
      },
      spacing: {
        section: spacing.section
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
