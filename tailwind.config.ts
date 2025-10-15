import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#2FB79A",
          blue: "#1E88E5",
          green: "#43A047",
          yellow: "#F9A825",
          dark: "#212121",
          bg: "#F5F5F5",
          white: "#FFFFFF"
        }
      },
      borderRadius: { xl: "16px", lg: "12px", md: "8px" },
      boxShadow: {
        card: "0 4px 24px rgba(0,0,0,0.06)",
        soft: "0 2px 10px rgba(0,0,0,0.05)"
      }
    }
  },
  plugins: []
};
export default config;
