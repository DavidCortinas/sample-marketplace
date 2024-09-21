import type { Config } from "tailwindcss";
import radixPlugin from "tailwindcss-radix";

export default {
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        indigo: {
          600: "#4f46e5",
          800: "#3730a3",
        },
        purple: {
          600: "#7c3aed",
          800: "#5b21b6",
        },
        "neon-cyan": "#00FFFF",
        "neon-pink": "#FF00FF",
        "neon-green": "#39FF14",
        "neon-yellow": "#FFFF00",
        "bg-primary": "var(--color-bg-primary)",
        "bg-secondary": "var(--color-bg-secondary)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "border": "var(--color-border)",
        "button-primary": "var(--color-button-primary)",
        "button-secondary": "var(--color-button-secondary)",
        "button-text": "var(--color-button-text)",
        "input-bg": "var(--color-input-bg)",
        "input-border": "var(--color-input-border)",
        "input-text": "var(--color-input-text)",
        "slider-bg": "var(--color-slider-bg)",
        "slider-fill": "var(--color-slider-fill)",
        "header-bg": "var(--color-header-bg)",
        "header-text": "var(--color-header-text)",
        "header-secondary": "var(--color-header-secondary)",
        "header-border": "var(--color-header-border)",
        "header-link": "var(--color-header-link)",
        "header-link-hover": "var(--color-header-link-hover)",
        "header-button": "var(--color-header-button)",
        "header-button-hover": "var(--color-header-button-hover)",
      },
      fontFamily: {
        cyberpunk: ["Orbitron", "sans-serif"], // You'll need to import this font
      },
      boxShadow: {
        glow: '0 0 5px theme("colors.neon-cyan"), 0 0 20px theme("colors.neon-cyan")',
      },
    },
  },
  plugins: [radixPlugin],
  darkMode: 'class',
} satisfies Config;
