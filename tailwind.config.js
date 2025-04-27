module.exports = {
  content: [
    "./src/**/*.{html,js}",
    "./index.html"
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            color: 'var(--text-color)',
            maxWidth: 'none',
            pre: {
              backgroundColor: 'var(--secondary-color)',
              color: 'var(--text-color)',
              padding: '1rem',
              borderRadius: '0.5rem',
              code: {
               : 'transparent',
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