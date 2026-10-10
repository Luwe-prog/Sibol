/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Sibol's palette. Use these names instead of writing the hex values in components.
      // Status colors (amber, green, blue, red, orange) stay on Tailwind's default scales.
      colors: {
        forest: { DEFAULT: '#14532D', dark: '#0E3F22' }, // primary actions, sidebar, brand
        cream: '#F7F6F0', // page background
        sage: '#DCE8D8', // quiet highlights and supporting surfaces
        charcoal: '#27352B', // headings and strong text
        line: '#D7DCD3', // card borders and dividers
        field: '#858F84', // input borders: light enough to stay calm, dark enough to see (3:1 on white)
      },
    },
  },
  plugins: [],
}
