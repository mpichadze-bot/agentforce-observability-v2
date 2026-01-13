/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Salesforce Lightning Design System colors
        'sf-blue': {
          50: '#EAF5FE',
          100: '#D4EBFD',
          200: '#A9D7FB',
          300: '#7EC3F9',
          400: '#1B96FF',
          500: '#0176D3',
          600: '#014486',
          700: '#032D60',
          800: '#001D3F',
          900: '#001428',
        },
        'sf-green': {
          400: '#45C65A',
          500: '#2E844A',
        },
        'sf-red': {
          400: '#EA001E',
          500: '#BA0517',
        },
        'sf-orange': {
          400: '#FE9339',
          500: '#DD7A01',
        },
        'sf-gray': {
          50: '#FAFAF9',
          100: '#F3F3F3',
          200: '#E5E5E4',
          300: '#C9C9C8',
          400: '#AEAEAE',
          500: '#747474',
          600: '#5C5C5C',
          700: '#444444',
          800: '#2E2E2E',
        },
      },
      fontFamily: {
        'sf': ['Salesforce Sans', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'sf-card': '0 2px 4px rgba(0, 0, 0, 0.1)',
        'sf-elevated': '0 4px 14px rgba(0, 0, 0, 0.1)',
        'sf-modal': '0 8px 24px rgba(0, 0, 0, 0.2)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flow-line': 'flowLine 2s ease-in-out infinite',
        'flow-line': 'flowLine 2s ease-in-out infinite',
        'node-pop': 'nodePop 0.5s ease-out forwards',
        'error-pulse': 'errorPulse 1.5s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        flowLine: {
          '0%, 100%': { strokeDashoffset: '0' },
          '50%': { strokeDashoffset: '20' },
        },
        nodePop: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '70%': { transform: 'scale(1.1)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        errorPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(234, 0, 30, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(234, 0, 30, 0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}