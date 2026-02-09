/** @type {

import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sonar: {
          bg: '#0a0f1a',
          panel: '#111827',
          accent: '#00ff88',
          'accent-dim': 'rgba(0, 255, 136, 0.1)',
          warning: '#ff6b35',
          danger: '#ef4444',
          grid: '#1f2937',
          'grid-light': '#374151',
          text: '#e5e7eb',
          muted: '#6b7280',
          target: {
            primary: '#00ff88',
            secondary: '#ff6b35',
            tertiary: '#ffaa00',
            quaternary: '#00aaff'
          }
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}