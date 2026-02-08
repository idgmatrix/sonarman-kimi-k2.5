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
          warning: '#ff6b35',
          grid: '#1f2937',
          text: '#e5e7eb',
          muted: '#6b7280'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}