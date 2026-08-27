/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        styrud: {
          dark: '#0B0B0C',
          panel: '#141416',
          elevated: '#1E1E22',
          border: 'rgba(255, 255, 255, 0.08)',
          textMuted: '#8E8E93',
          accent: '#FFFFFF'
        }
      },
      fontFamily: {
        sans: ['"Bagnard Sans"', 'Inter', 'SF Pro Display', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
