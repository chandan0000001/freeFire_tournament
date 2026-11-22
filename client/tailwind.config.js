/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#ef7166',
          amber: '#e8b978',
          cyan: '#79bdb2',
          gold: '#efc88e',
          dark: '#160e13',
          darker: '#10090d',
          card: '#24171e',
          cardBorder: '#49303a',
          hover: '#38242e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Rajdhani', 'sans-serif'],
      },
      boxShadow: {
        'glow-orange': '0 0 20px rgba(255, 87, 34, 0.35)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.35)',
      },
    },
  },
  plugins: [],
}
