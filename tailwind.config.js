/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#f4efe2',
        paper: '#faf6ec',
        ink: '#1f1d18',
        muted: '#7a7368',
        accent: '#c2410c',
        bar: '#2a2823',
        rule: '#1f1d18',
        edge: '#e5dfcd',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        serif: ['"Source Serif 4"', 'Source Serif Pro', 'serif'],
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      letterSpacing: {
        eyebrow: '0.18em',
        chip: '0.14em',
      },
    },
  },
  plugins: [],
};
