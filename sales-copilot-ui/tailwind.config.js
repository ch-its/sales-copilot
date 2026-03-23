/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0a0a0a',
          800: '#141414',
          700: '#1f1f1f',
          600: '#2d2d2d',
        },
        neon: {
          blue: '#00f0ff',
          green: '#00ff66',
          purple: '#b026ff',
          red: '#ff003c'
        }
      },
      boxShadow: {
        'glow-blue': '0 0 15px 2px rgba(0, 240, 255, 0.3)',
        'glow-green': '0 0 20px 4px rgba(0, 255, 102, 0.4)',
        'glow-red': '0 0 25px 5px rgba(255, 0, 60, 0.4)',
        'glow-purple': '0 0 20px 3px rgba(176, 38, 255, 0.4)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: .7 },
        }
      }
    },
  },
  plugins: [],
}

