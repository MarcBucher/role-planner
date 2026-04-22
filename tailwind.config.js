/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bh: {
          navy:        '#24303e',
          'navy-hover':'#2d3c4d',
          teal:        '#38b5aa',
          'teal-dark': '#2ea095',
          amber:       '#f7aa08',
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'sans-serif'],
        sans:    ['"Fira Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

