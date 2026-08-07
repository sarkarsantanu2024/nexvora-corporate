import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0a1128",
        brand: {
          50: "#eef3ff",
          100: "#dbe5ff",
          300: "#96b0ff",
          500: "#3b5bdb",
          600: "#2f4ac0",
          700: "#243a99",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
