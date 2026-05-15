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
      animation: {
        shimmer: 'shimmer 1.6s ease-in-out infinite',
        'fade-in': 'fadeIn 0.25s ease-out both',
        'slide-up': 'slideUp 0.3s ease-out both',
        'slide-in': 'slideIn 0.25s ease-out both',
        'scale-in': 'scaleIn 0.2s ease-out both',
        'bounce-in': 'bounceIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.94)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        bounceIn: {
          from: { opacity: '0', transform: 'scale(0.8)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      boxShadow: {
        'inner-sm': 'inset 0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'glow-hotel': '0 0 0 3px rgb(26 78 138 / 0.15)',
        'glow-green': '0 0 0 3px rgb(34 197 94 / 0.15)',
      },
    },
  },
  plugins: [],
}

export default config
