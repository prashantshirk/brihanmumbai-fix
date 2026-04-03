/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#E53935',      // BMC red
        secondary: '#FFF8F0',    // warm off-white
        accent: '#FF6D00',       // Mumbai orange
        dark: '#1A1A2E'          // dark background
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        heading: ['Syne', 'sans-serif']
      }
    },
  },
  plugins: [],
}
