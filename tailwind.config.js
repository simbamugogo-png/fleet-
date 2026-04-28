/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{html}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['JetBrains Mono', 'monospace'],
        mono: ['JetBrains Mono', 'monospace'],
        heading: ['Orbitron', 'sans-serif'],
      },
      colors: {
        bg: '#0a0b0f',
        bg2: '#111218',
        bg3: '#1a1d23',
        border: 'rgba(99, 102, 241, 0.2)',
        border2: 'rgba(99, 102, 241, 0.4)',
        text: '#f8fafc',
        text2: '#94a3b8',
        text3: '#64748b',
        accent: '#06b6d4',
        accent2: '#3b82f6',
        warn: '#f59e0b',
        danger: '#ef4444',
        green: '#10b981',
        blue: '#3b82f6',
        amber: '#f59e0b',
        red: '#ef4444',
        teal: '#06b6d4',
        purple: '#8b5cf6',
      },
      animation: {
        'pulse': 'pulse 2s infinite',
        'float': 'float 6s ease-in-out infinite',
        'border-glow': 'borderGlow 3s ease-in-out infinite',
        'hologram-sweep': 'hologramSweep 3s infinite',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        borderGlow: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        hologramSweep: {
          '0%': { left: '-100%' },
          '100%': { left: '100%' },
        },
      },
    },
  },
  plugins: [],
}
