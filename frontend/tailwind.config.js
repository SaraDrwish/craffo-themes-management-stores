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
      },

      backgroundImage: {
        'gradent-color':
          'linear-gradient(135deg, #9f6af0 0%, #150543 100%)',
        'gradent-color-op':
          'linear-gradient(135deg, #150543 0%,  #9f6af0 100%)',

         

      },
    },
  },
  plugins: [],
}