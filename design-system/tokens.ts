export const colors = {
  brand: {
    bg: "var(--color-brand-bg)",
    light: "var(--color-brand-light)",
    dark: "var(--color-brand-dark)",
    primary: "var(--color-brand-primary)",
    primaryStrong: "var(--color-brand-primary-strong)",
    primaryMuted: "var(--color-brand-primary-muted)",
    teal: "var(--color-brand-teal)",
    blue: "var(--color-brand-blue)",
    green: "var(--color-brand-green)",
    success: "var(--color-brand-success)",
    successMuted: "var(--color-brand-success-muted)",
    warning: "var(--color-brand-warning)",
    warningMuted: "var(--color-brand-warning-muted)",
    outline: "var(--color-brand-outline)"
  },
  surface: {
    DEFAULT: "var(--color-surface)",
    muted: "var(--color-surface-muted)"
  },
  text: {
    DEFAULT: "var(--color-textc)",
    muted: "var(--color-text-muted)",
    ink: "var(--color-ink)",
    inkMuted: "var(--color-ink-muted)"
  },
  neutral: {
    50: "var(--color-neutral-50)",
    100: "var(--color-neutral-100)",
    200: "var(--color-neutral-200)",
    300: "var(--color-neutral-300)",
    400: "var(--color-neutral-400)",
    500: "var(--color-neutral-500)",
    600: "var(--color-neutral-600)",
    700: "var(--color-neutral-700)",
    800: "var(--color-neutral-800)",
    900: "var(--color-neutral-900)"
  },
  danger: {
    DEFAULT: "var(--color-danger)",
    muted: "var(--color-danger-muted)"
  }
};

export const spacing = {
  xs: "0.375rem",
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.25rem",
  xxl: "1.75rem",
  section: "3.5rem"
};

export const radii = {
  xs: "0.375rem",
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.25rem",
  xxl: "1.75rem",
  threeXl: "2rem"
};

export const typography = {
  fontFamily: {
    sans: "var(--font-sans), Inter, system-ui, -apple-system, sans-serif"
  },
  fontSize: {
    h1: {
      size: "1.875rem",
      lineHeight: "2.5rem",
      weight: 700
    },
    h2: {
      size: "1.5rem",
      lineHeight: "2.125rem",
      weight: 600
    },
    h3: {
      size: "1.25rem",
      lineHeight: "1.875rem",
      weight: 600
    },
    body: {
      size: "1rem",
      lineHeight: "1.7rem",
      weight: 400
    },
    caption: {
      size: "0.875rem",
      lineHeight: "1.4rem",
      weight: 500
    }
  }
};

export const shadows = {
  sm: "0 6px 18px rgba(17, 24, 39, 0.08)",
  md: "0 12px 28px rgba(17, 24, 39, 0.12)",
  lg: "0 18px 40px rgba(17, 24, 39, 0.16)"
};

export const tokens = {
  colors,
  spacing,
  radii,
  typography,
  shadows
};

export type DesignTokens = typeof tokens;
