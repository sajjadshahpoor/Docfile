/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        office: {
          word: '#2b579a',
          excel: '#217346',
          powerpoint: '#c43e1c'
        }
      }
    }
  },
  plugins: []
}
