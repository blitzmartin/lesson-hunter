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
        display: ['CODE', 'sans-serif'],
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
