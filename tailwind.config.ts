import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F4F4F1",
        surface: "#FFFFFF",
        ink: {
          DEFAULT: "#111111",
          soft: "#6F6F6B"
        },
        line: "#E4E4DF",
        muted: "#EEEEEA",
        brand: {
          DEFAULT: "#2E7D4F",
          soft: "#E6F4EC",
          deep: "#1B5E38"
        },
        success: {
          DEFAULT: "#2E8B57",
          soft: "#E7F3EC"
        },
        warning: {
          DEFAULT: "#C98A00",
          soft: "#FBF3E2"
        },
        danger: {
          DEFAULT: "#D94A4A",
          soft: "#FBEAEA"
        },
        info: {
          DEFAULT: "#5B6FE8",
          soft: "#EDEFFD"
        }
      },
      borderRadius: {
        card: "24px",
        container: "28px",
        btn: "14px",
        field: "16px"
      },
      boxShadow: {
        card: "0 1px 2px rgba(17, 17, 17, 0.04), 0 10px 28px -18px rgba(17, 17, 17, 0.14)",
        raise: "0 2px 4px rgba(17, 17, 17, 0.05), 0 18px 44px -20px rgba(17, 17, 17, 0.22)",
        nav: "0 -1px 0 rgba(17,17,17,0.06), 0 -8px 24px -16px rgba(17,17,17,0.12)"
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        display: ["var(--font-display)", "var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"]
      },
      maxWidth: {
        content: "72rem"
      }
    }
  },
  plugins: []
};

export default config;
