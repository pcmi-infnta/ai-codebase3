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
              padding: '1.25rem',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-color)',
              marginTop: '1.5rem',
              marginBottom: '1.5rem',
              overflowX: 'auto',
              fontSize: '0.875rem',
              lineHeight: '1.7142857',
              code: {
                backgroundColor: 'transparent',
                padding: '0',
                color: 'inherit',
                fontSize: 'inherit',
                fontWeight: '400',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
              }
            },
            code: {
              backgroundColor: 'rgb(31 41 55)',
              color: 'rgb(229 231 235)',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '400',
              border: '1px solid var(--border-color)',
              '&::before': {
                content: '""'
              },
              '&::after': {
                content: '""'
              }
            },
            'pre code': {
              backgroundColor: 'transparent',
              padding: '0',
              color: 'inherit',
              fontSize: '0.875rem',
              lineHeight: '1.5'
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