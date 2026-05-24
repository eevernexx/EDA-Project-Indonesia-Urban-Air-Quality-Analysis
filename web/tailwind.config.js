/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Outfit", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#ecf3ff",
          100: "#dde9ff",
          200: "#c2d6ff",
          300: "#9cb9ff",
          400: "#7592ff",
          500: "#465fff",
          600: "#3641f5",
          700: "#2a31d8",
          800: "#252dae",
          900: "#262e89",
        },
        gray: {
          50: "#f9fafb",
          100: "#f2f4f7",
          200: "#e4e7ec",
          300: "#d0d5dd",
          400: "#98a2b3",
          500: "#667085",
          600: "#475467",
          700: "#344054",
          800: "#1d2939",
          900: "#101828",
        },
        success: { 50: "#ecfdf3", 500: "#12b76a", 600: "#039855", 700: "#027a48" },
        warning: { 50: "#fffaeb", 500: "#f79009", 600: "#dc6803", 700: "#b54708" },
        error: { 50: "#fef3f2", 500: "#f04438", 600: "#d92d20", 700: "#b42318" },
      },
      boxShadow: {
        card: "0px 1px 3px 0px rgba(16,24,40,0.1), 0px 1px 2px 0px rgba(16,24,40,0.06)",
        "card-lg": "0px 12px 16px -4px rgba(16,24,40,0.08), 0px 4px 6px -2px rgba(16,24,40,0.03)",
      },
    },
  },
  plugins: [],
};
