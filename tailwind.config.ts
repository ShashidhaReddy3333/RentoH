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
        sm: "1.5rem",
        lg: "2rem",
        xl: "2.5rem",
        "2xl": "3rem"
      }
    },
    extend: {
      colors: {
        brand: {
          blue: "#1E88E5",
          green: "#43A047",
          yellow: "#F9A825",
          dark: "#212121",
          bg: "#F5F5F5"
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F1F5F9"
        },
        ink: {
          DEFAULT: "#1F2933",
          muted: "#52616B"
        },
        outline: "#D9E2EC",
        danger: {
          DEFAULT: "#D32F2F",
          subtle: "#FDE8E8"
        },
        success: {
          DEFAULT: "#2E7D32",
          subtle: "#E6F4EA"
        }
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px"
      },
      boxShadow: {
        sm: "0 4px 12px rgba(15, 23, 42, 0.06)",
        md: "0 10px 30px rgba(15, 23, 42, 0.08)",
        lg: "0 18px 48px rgba(15, 23, 42, 0.12)"
      },
      fontFamily: {
        sans: ["Inter", "var(--font-sans)", "system-ui", "-apple-system", "sans-serif"]
      },
      fontSize: {
        h1: ["1.875rem", { lineHeight: "2.25rem", fontWeight: "700" }],
        h2: ["1.5rem", { lineHeight: "2rem", fontWeight: "600" }],
        h3: ["1.25rem", { lineHeight: "1.75rem", fontWeight: "600" }],
        body: ["1rem", { lineHeight: "1.7rem", fontWeight: "400" }],
        small: ["0.875rem", { lineHeight: "1.4rem", fontWeight: "400" }]
      },
      spacing: {
        section: "3rem"
      },
      transitionTimingFunction: {
        "ease-out": "cubic-bezier(0.16, 1, 0.3, 1)"
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
          boxShadow: "0 0 0 4px rgba(30, 136, 229, 0.2)"
        },
        ".focus-ring-inset": {
          outline: "none",
          boxShadow: "inset 0 0 0 2px rgba(30, 136, 229, 0.3)"
        }
      });
    }
  ]
};

export default config;
