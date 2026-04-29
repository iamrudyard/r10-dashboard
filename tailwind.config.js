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
      boxShadow: {
        panel: '0 18px 45px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
}
