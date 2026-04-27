/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"League Spartan"', 'system-ui', 'sans-serif'],
        body: ['Roboto', 'system-ui', 'sans-serif'],
      },
      colors: {
        paceon: {
          olive: '#6a714b',
          orange: '#c85103',
          paper: '#f5f3ee',
          ink: '#1a1a1a',
          line: '#e3e0d8',
          panel: '#fafaf7',
        },
      },
    },
  },
  plugins: [],
};
