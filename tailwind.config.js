/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,ts,jsx,tsx}",
    "./thoughts/**/*.{html,md}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#4F46E5',
          'primary-hover': '#4338CA',
          'primary-active': '#3730A3',
          secondary: '#0D9488',
        },
        financial: {
          credit: '#10B981',
          debit: '#F59E0B',
          error: '#EF4444',
          info: '#06B6D4',
        },
        surface: {
          canvas: '#090D16',
          card: '#111827',
          subtle: '#1F2937',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
};
