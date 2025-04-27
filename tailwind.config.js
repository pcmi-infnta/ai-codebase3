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
            code: {
              color: 'var(--text-color)',
              backgroundColor: 'var(--secondary-color)',
              borderRadius: '0.25rem',
              padding: '0.2rem 0.4rem',
            },
            pre: {
              backgroundColor: 'var(--secondary-color)',
              color: 'var(--text-color)',
              borderRadius: '0.5rem',
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