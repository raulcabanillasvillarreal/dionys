import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        hotel: { DEFAULT: '#1a4e8a', light: '#2563eb' },
        importaciones: { DEFAULT: '#065f46', light: '#059669' },
        club: { DEFAULT: '#6b21a8', light: '#9333ea' },
      },
    },
  },
  plugins: [],
}

export default config
