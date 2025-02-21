/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // Enable dark mode

  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('tailwind-scrollbar'),
    // Other plugins
  ],
}