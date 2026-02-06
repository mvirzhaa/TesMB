/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'quipper-blue': '#0099cc',
        'quipper-dark': '#007799',
      }
    },
  },
  plugins: [],
}