/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        primary: "#3B82F6",
        secondary: "#031530",
        offwhite: "#F1F5FD",
        cta: "#1E70EA",
        wvcbgrey: "#323842",
        accent: "#F59E0B",
        "custom-blue": {
          100: "#E6F0FF",
          200: "#BFDAFF",
          300: "#99C3FF",
          400: "#66A3FF",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
        },
      },
    },
  },
  plugins: [],
};
