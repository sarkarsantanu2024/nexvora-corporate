import type { Config } from 'tailwindcss';

/**
 * Colours come from the Mantra Kidz logo: the indigo of the shield and the
 * red of the laurel. The four "play" colours are for the public website's
 * illustrations and programme cards; the dashboards stay calm (indigo + slate).
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f3f2fc',
          100: '#e6e4f8',
          200: '#cfcbf1',
          300: '#aea7e5',
          400: '#897ed6',
          500: '#6a5cc6',
          600: '#5445ae',
          700: '#3f348f',
          800: '#352c75',
          900: '#2a245c',
          950: '#19153d',
        },
        accent: {
          50: '#fff1f1',
          100: '#ffe0e1',
          200: '#ffc6c8',
          300: '#ff9da0',
          400: '#f9666a',
          500: '#e31e24',
          600: '#c8141a',
          700: '#a31116',
          800: '#86151a',
          900: '#70171b',
        },
        sun: { 50: '#fff9e6', 100: '#fff0bf', 300: '#ffd866', 400: '#ffc83d', 500: '#f5ad0a', 700: '#a86a00' },
        mint: { 50: '#e9fbf6', 100: '#c8f4e8', 300: '#6edcc0', 400: '#2ec4a0', 500: '#17a685', 700: '#0c6b56' },
        sky: { 50: '#eaf7ff', 100: '#cdebff', 300: '#7fcfff', 400: '#38b6ff', 500: '#1296e6', 700: '#0a5e94' },
        coral: { 50: '#fff2ee', 100: '#ffdfd6', 300: '#ffa58d', 400: '#ff7a59', 500: '#f0562f', 700: '#a3320f' },
        ink: {
          50: '#f7f7fb',
          100: '#eeeef5',
          200: '#dfdfea',
          300: '#c5c5d6',
          400: '#9a9ab2',
          500: '#71718c',
          600: '#55556e',
          700: '#3f3f56',
          800: '#2a2a3f',
          900: '#1a1a2c',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-rounded', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      borderRadius: { '4xl': '2rem', '5xl': '2.75rem' },
      boxShadow: {
        card: '0 1px 2px rgba(26,26,44,.05), 0 4px 16px -4px rgba(26,26,44,.08)',
        lift: '0 2px 4px rgba(26,26,44,.06), 0 18px 40px -12px rgba(63,52,143,.28)',
        glow: '0 12px 40px -8px rgba(227,30,36,.35)',
      },
      keyframes: {
        'fade-up': { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'none' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'scale-in': { from: { opacity: '0', transform: 'scale(.96)' }, to: { opacity: '1', transform: 'none' } },
        'slide-in-right': { from: { transform: 'translateX(100%)' }, to: { transform: 'none' } },
        'slide-in-left': { from: { transform: 'translateX(-100%)' }, to: { transform: 'none' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        wiggle: { '0%,100%': { transform: 'rotate(-4deg)' }, '50%': { transform: 'rotate(4deg)' } },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        'pulse-ring': { '0%': { transform: 'scale(1)', opacity: '.55' }, '100%': { transform: 'scale(1.9)', opacity: '0' } },
        shimmer: { from: { backgroundPosition: '200% 0' }, to: { backgroundPosition: '-200% 0' } },
      },
      animation: {
        'fade-up': 'fade-up .45s cubic-bezier(.2,.7,.2,1) both',
        'fade-in': 'fade-in .3s ease both',
        'scale-in': 'scale-in .22s cubic-bezier(.2,.7,.2,1) both',
        'slide-in-right': 'slide-in-right .28s cubic-bezier(.2,.7,.2,1) both',
        float: 'float 6s ease-in-out infinite',
        wiggle: 'wiggle 3s ease-in-out infinite',
        marquee: 'marquee 40s linear infinite',
        'pulse-ring': 'pulse-ring 1.4s cubic-bezier(.2,.7,.2,1) infinite',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
