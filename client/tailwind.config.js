/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16241E",
        paper: "#F7F5EE",
        emerald: {
          DEFAULT: "#2F6F4E",
          dark: "#234F38",
        },
        ochre: "#C77D2E",
        muted: "#5B6B62",
        line: "#DCD8CC",
      },
      fontFamily: {
        serif: ["Fraunces", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "4px",
      },
    },
  },
  plugins: [],
};
