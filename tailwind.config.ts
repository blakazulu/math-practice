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
          300: "#86EFAC",
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
          100: "#FEE2E2",
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
        card: "0 1px 3px rgba(15,26,20,0.04), 0 1px 2px rgba(15,26,20,0.03)",
        "card-hover": "0 8px 24px rgba(15,26,20,0.06), 0 2px 6px rgba(15,26,20,0.04)",
        glow: "0 0 0 3px rgba(34,197,94,0.18), 0 0 24px rgba(34,197,94,0.15)",
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
        bob: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-2px)" },
        },
        "pulse-glow": {
          "0%, 100%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(34,197,94,0.4)" },
          "50%": { transform: "scale(1.04)", boxShadow: "0 0 0 8px rgba(34,197,94,0)" },
        },
        "confetti-pop": {
          "0%": { opacity: "0", transform: "translate(0,0) scale(0.4) rotate(0deg)" },
          "20%": { opacity: "1" },
          "100%": {
            opacity: "0",
            transform: "translate(var(--cx,0px), var(--cy,-40px)) scale(1) rotate(var(--cr,30deg))",
          },
        },
        "ring-sweep": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "underline-grow": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        shake: "shake 0.35s ease-in-out",
        "star-fly": "star-fly 1.2s ease-out forwards",
        bob: "bob 2s ease-in-out infinite",
        "pulse-glow": "pulse-glow 1.4s ease-in-out infinite",
        "confetti-pop": "confetti-pop 900ms ease-out forwards",
        "ring-sweep": "ring-sweep 2s linear infinite",
        "underline-grow": "underline-grow 240ms ease-out forwards",
        flicker: "flicker 200ms ease-in-out",
      },
    },
  },
  plugins: [rtl],
} satisfies Config;
