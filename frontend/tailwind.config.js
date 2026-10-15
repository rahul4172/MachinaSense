/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        swiss: {
          bg: '#FFFFFF',
          fg: '#000000',
          muted: '#F2F2F2',
          subtle: '#E5E5E5',
          accent: '#FF3000', // Iconic Swiss Red
          border: '#000000',
          dark: '#111111'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'monospace']
      },
      borderRadius: {
        DEFAULT: '0px',
        none: '0px',
        sm: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        full: '0px'
      }
    },
  },
  plugins: [],
}
