/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        church: {
          blue: "#1B4F8A",
          "blue-light": "#2E6DB4",
          "blue-dark": "#12376B",
          gold: "#C9A84C",
          "gold-light": "#E8C96A",
          cream: "#F8F5EF",
          "gray-soft": "#F0EDE8",
        },
      },
    },
  },
  plugins: [],
};
