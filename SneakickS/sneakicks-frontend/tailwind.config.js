/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f6fb",
          100: "#e8eaf6",
          500: "#3f51b5",
          600: "#3949ab",
          700: "#303f9f",
          900: "#1a237e",
        },
      },
    },
  },
  plugins: [],
};
