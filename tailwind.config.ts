import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pastel color scheme for baby theme
        baby: {
          pink: "#FFE4E9",
          blue: "#E4F1FF",
          yellow: "#FFF9E4",
          green: "#E4FFED",
          purple: "#F3E4FF",
          peach: "#FFE4D6",
        },
        primary: {
          50: "#FFF1F2",
          100: "#FFE4E9",
          200: "#FFCDD8",
          300: "#FFB3C6",
          400: "#FF8BA3",
          500: "#FF6B8A", // Main primary
          600: "#E85575",
          700: "#C63D5F",
          800: "#A32748",
          900: "#7A1432",
        },
        accent: {
          50: "#E4F1FF",
          100: "#CCE3FF",
          200: "#99C7FF",
          300: "#66ABFF",
          400: "#3390FF",
          500: "#0074FF", // Main accent
          600: "#005CD6",
          700: "#0046AD",
          800: "#003184",
          900: "#001F5C",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-fredoka)", "cursive"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
        playful: "0 4px 20px -2px rgba(255, 107, 138, 0.25)",
      },
      animation: {
        "bounce-slow": "bounce 2s infinite",
        wiggle: "wiggle 1s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
      },
      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

export default config;
