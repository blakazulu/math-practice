import type { Config } from "tailwindcss";
import rtl from "tailwindcss-rtl";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Heebo", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#F0FDF4",
          100: "#DCFCE7",
          200: "#BBF7D0",
          400: "#4ADE80",
          500: "#22C55E",
          600: "#16A34A",
          700: "#15803D",
          900: "#14532D",
        },
        ink: "#0F1A14",
        muted: "#6B7280",
        faint: "#9CA3AF",
        hair: "#F3F4F6",
        border: "#E5E7EB",
        surface: "#F9FAFB",
        warn: {
          50: "#FEFCE8",
          200: "#FEF08A",
          700: "#A16207",
        },
        danger: {
          50: "#FEF2F2",
          200: "#FECACA",
          600: "#DC2626",
        },
      },
      letterSpacing: {
        tightest: "-0.02em",
      },
      boxShadow: {
        cta: "0 4px 0 #15803D",
        "cta-pressed": "0 2px 0 #15803D",
      },
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "75%": { transform: "translateX(4px)" },
        },
        "star-fly": {
          "0%": { opacity: "0", transform: "translateY(0) scale(0.8)" },
          "30%": { opacity: "1", transform: "translateY(-20px) scale(1.1)" },
          "100%": { opacity: "0", transform: "translateY(-60px) scale(0.9)" },
        },
      },
      animation: {
        shake: "shake 0.35s ease-in-out",
        "star-fly": "star-fly 1.2s ease-out forwards",
      },
    },
  },
  plugins: [rtl],
} satisfies Config;
