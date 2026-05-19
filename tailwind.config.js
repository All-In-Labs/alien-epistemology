/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#ecede4',
        paper: '#faf6ec',
        ink: '#1f1d18',
        muted: '#6e675c',
        accent: '#2e6a31',
        bar: '#2a2823',
        rule: '#1f1d18',
        edge: '#e5dfcd',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        subhead: ['Podkova', 'Georgia', 'serif'],
        serif: ['"Hind Vadodara"', 'system-ui', 'sans-serif'],
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
