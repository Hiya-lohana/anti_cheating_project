/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom color layers tuned to perfectly map the uploaded mockup screenshots
        proctorBackground: '#0b0f19', // The deep dark workspace backdrop
        proctorPanel: '#111c44',      // The lighter navy blue inside cards and layouts
        proctorPurple: '#4f46e5',     // Main interactive state button tint
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial'],
      },
    },
  },
  plugins: [],
}