/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
        "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      skew: {
        '10': '10deg',
        '15': '15deg',
        '20': '20deg',
      },
      colors: {
        primary: {
          light: '#F24B59', // Light Red
          DEFAULT: '#D91E2E', // Red
        },
        secondary: '#2B57D9', // Blue
        accent: '#4981F2', // Light Blue
        dark: '#262626', // Dark
      },
      keyframes: {
        rain: {
          '0%': { top: '-10%', opacity: '0' },
          '30%': { opacity: '1' },
          '100%': { top: '100%', opacity: '0' },
        },
      },
      animation: {
        rain: 'rain 0.5s linear infinite',
      },
    },
  },
  plugins: [],
};
