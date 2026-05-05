/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
    './node_modules/@tremor/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#111111',
          coral: '#e05e46',
          bg: '#f9f9fb',
        },
        civic: {
          50: '#f3f8f6',
          100: '#dcece6',
          500: '#2f7d64',
          600: '#276b56',
          700: '#225747',
          900: '#17392f',
        },
        audit: {
          50: '#fff7ed',
          500: '#d97706',
          700: '#9a3412',
        },
      },
      borderRadius: {
        '4xl': '2rem',
        'grid': '30px',
      },
      boxShadow: {
        panel: '0 18px 45px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
}
