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
          800: "#1b2c74",
          900: "#131f52",
        },
        // Taken off the logo's lower half, which fades blue into violet.
        violet: {
          400: "#8b7bff",
          500: "#6a4ff0",
          600: "#5433d6",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        lift: "0 18px 40px -18px rgba(10, 17, 40, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
