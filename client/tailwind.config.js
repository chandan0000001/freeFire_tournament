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
          orange: '#FF5722',
          amber: '#F59E0B',
          cyan: '#06B6D4',
          gold: '#FBBF24',
          dark: '#0B0E14',
          darker: '#07090D',
          card: '#121722',
          cardBorder: '#1F293D',
          hover: '#192235',
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
