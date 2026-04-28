import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        noir: {
          ink: "#0b0b0e",
          smoke: "#1a1a20",
          ash: "#2a2a32",
          fog: "#9aa0a6",
          paper: "#f4f1ea",
          neon: "#ff3c3c",
          amber: "#f5a623",
        },
      },
      fontFamily: {
        serif: ["Crimson Pro", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "rain-fall": "rain-fall 0.6s linear infinite",
        "neon-flicker": "neon-flicker 3s ease-in-out infinite",
      },
      keyframes: {
        "rain-fall": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "neon-flicker": {
          "0%, 100%": { opacity: "1" },
          "45%": { opacity: "0.92" },
          "50%": { opacity: "0.6" },
          "55%": { opacity: "0.92" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
