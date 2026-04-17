/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#002E5D",
          light: "#003d7a",
          dark: "#001f3f",
        },
        gold: {
          DEFAULT: "#9E700E",
          light: "#b8820f",
          dark: "#7a5609",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Noto Serif", "Georgia", "serif"],
      },
      fontSize: {
        base: ["18px", { lineHeight: "1.6" }],
        sm: ["16px", { lineHeight: "1.5" }],
        xs: ["14px", { lineHeight: "1.4" }],
        lg: ["20px", { lineHeight: "1.5" }],
        xl: ["24px", { lineHeight: "1.4" }],
        "2xl": ["28px", { lineHeight: "1.3" }],
        "3xl": ["32px", { lineHeight: "1.25" }],
      },
      minHeight: {
        touch: "48px",
      },
      minWidth: {
        touch: "48px",
      },
    },
  },
  plugins: [],
};
