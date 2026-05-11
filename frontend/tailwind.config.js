/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'dark-navy': '#150543',
        'purple': '#a46df6',
        'purplelight': '#ccb1f4',
        'mauve': '#9b92b3',
        'light-mauve': '#e0ccfe',
      }
    },
  },
  plugins: [],
}