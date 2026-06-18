/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // StockX-style deep green brand palette
        brand: {
          50: "#e9f6ef",
          100: "#c8e9d6",
          200: "#95d4b0",
          300: "#5cbb88",
          400: "#2aa46a",
          500: "#0e8c54",
          600: "#007a4d",
          700: "#006340",
          800: "#054e33",
          900: "#043927",
        },
        ink: {
          DEFAULT: "#1a1a1a",
          soft: "#5c5c5c",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.18s ease-out",
      },
    },
  },
  plugins: [],
};
