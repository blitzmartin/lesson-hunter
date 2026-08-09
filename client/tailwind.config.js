/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F4F1EA',
        ink: '#1F1F1D',
        yellow: '#FCE285',
        'yellow-deep': '#F4CE5A',
        line: '#DAD6C9',
        muted: '#6E6B62',
        'muted-2': '#8A867B',
        'paper-2': '#ECE8DD',
        desk: '#E7E4DB',
        'ink-bg': '#1F1F1D',
        'ink-dot': '#34342F',
        'paper-on-ink': '#F4F1EA',
        'muted-on-ink': '#A7A399',
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Inter', 'system-ui', 'sans-serif'],
        logo: ['Unbounded', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'loading-dot': {
          '0%, 80%, 100%': { opacity: '0.2', transform: 'translateY(0)' },
          '40%': { opacity: '1', transform: 'translateY(-2px)' },
        },
      },
      animation: {
        'loading-dot': 'loading-dot 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
