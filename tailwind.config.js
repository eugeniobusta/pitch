/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        forest: {
          950: '#1A2E0F',
          900: '#22391A',
          800: '#2E4820',
          700: '#3A5C28',
          600: '#476F31',
          500: '#56843C',
          400: '#6D9E52',
        },
        accent: '#6DB882',
        warm: '#C4944A',
        copper: '#8B5E3C',
        cream: '#E8C9A0',
        surface: {
          DEFAULT: '#2A3D1C',
          light: '#35501F',
          card: '#F9F6F2',
          input: '#F2EDE8',
        },
        text: {
          primary: '#1A1A1A',
          secondary: '#5A5A5A',
          muted: '#9A9A9A',
          inverse: '#F9F6F2',
        },
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
