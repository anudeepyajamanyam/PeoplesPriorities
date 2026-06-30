/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coral: {
          DEFAULT: '#FF6B35',
          light: '#FFE8DC',
          dark: '#B8431D',
        },
        'surface-warm': '#FFF8F0',
        'surface-app': '#FAFAF8',
        'border-soft': '#ECE7DE',
        primary: {
          DEFAULT: '#FF6B35',
          dark: '#B8431D',
        },
        accent: {
          DEFAULT: '#534AB7',
        },
        customTeal: '#0F6E56',
        customPurple: '#534AB7',
        customAmber: '#854F0B',
        customSuccess: '#1D9E75',
        customTextNearBlack: '#1A1A1A',
        customTextMuted: '#5F5E5A',
        customTextPlaceholder: '#888780',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
