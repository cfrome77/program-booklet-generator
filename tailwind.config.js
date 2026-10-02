/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-cream': 'var(--bg-cream)',
        'parchment-subtle': 'var(--parchment-subtle)',
        'navy-dark': 'var(--navy-dark)',
        'teal-accent': 'var(--teal-accent)',
        'charcoal': 'var(--charcoal)',
        'silver': 'var(--silver)',
      },
      fontFamily: {
        main: ['Open Sans', 'sans-serif'],
        title: ['Cinzel', 'serif'],
      },
    },
  },
  plugins: [],
}
