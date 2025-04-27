/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            pre: {
              backgroundColor: 'var(--secondary-color)',
              color: 'var(--text-color)',
              padding: '1rem',
              borderRadius: '0.5rem',
              code: {
                backgroundColor: 'transparent',
                padding: '0',
                color: 'inherit'
              }
            },
            code: {
              backgroundColor: 'var(--secondary-color)',
              color: 'var(--text-color)',
              padding: '0.2rem 0.4rem',
              borderRadius: '0.25rem',
              '&::before': {
                content: '""'
              },
              '&::after': {
                content: '""'
              }
            }
          }
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography')
  ]
}