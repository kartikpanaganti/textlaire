/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // Enable dark mode

  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light mode colors
        light: {
          primary: "#3B82F6", // Blue
          secondary: "#10B981", // Green
          background: "#F9FAFB", // Light gray
          surface: "#FFFFFF", // White
          text: {
            primary: "#111827", // Dark gray
            secondary: "#4B5563", // Medium gray
            muted: "#9CA3AF", // Light gray
          },
          border: "#E5E7EB", // Light gray
        },
        // Dark mode colors
        dark: {
          primary: "#3B82F6", // Blue
          secondary: "#10B981", // Green
          background: "#111827", // Dark gray
          surface: "#1F2937", // Medium dark gray
          text: {
            primary: "#F9FAFB", // White
            secondary: "#E5E7EB", // Light gray
            muted: "#9CA3AF", // Medium gray
          },
          border: "#374151", // Dark gray
        }
      }
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
    // Other plugins
  ],
}