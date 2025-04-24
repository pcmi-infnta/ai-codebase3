/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{html,js}"],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            color: 'var(--text-color)',
            a: {
              color: 'var(--accent-color)',
            },
            'code::before': {
              content: '""'
            },
            'code::after': {
              content: '""'
            }
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
}