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
} satisfies Config;
