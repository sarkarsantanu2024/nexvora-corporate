import type { Config } from 'tailwindcss';

/**
 * The colours of the whole project.
 *
 * PER CLIENT, CHANGE TWO SCALES: `brand` (the main colour of the logo: the
 * chosen menu item, buttons, links) and `accent` (the second colour: the
 * website's main call-to-action button, alerts, "delete"). Keep every step
 * from 50 (lightest) to 900 or 950 (darkest); a tool such as uicolors.app
 * makes the eleven steps from one colour. Then copy the new brand-700 into
 * `themeColor` in src/config/brand.ts and into public/offline.html.
 *
 * The four helper colours (sun, mint, sky, coral) and the `ink` greys are
 * shared by every client: they colour status badges, charts and the website's
 * decorations, and rarely need to change.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          // Navy of the school seal
          50: '#f0f3fb',
          100: '#dfe5f6',
          200: '#c3cdee',
          300: '#97a8e1',
          400: '#6a7fd1',
          500: '#4a5fc2',
          600: '#3647a8',
          700: '#2b3888',
          800: '#262f6f',
          900: '#232a5c',
          950: '#161a3a',
        },
        accent: {
          // Red for the main website button and alerts
          50: '#fff2f1',
          100: '#ffe1df',
          200: '#ffc8c4',
          300: '#ffa29b',
          400: '#fd6d63',
          500: '#f2433a',
          600: '#df2a22',
          700: '#bb1f18',
          800: '#9a1e19',
          900: '#801f1b',
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
      // The dashboards ask for squarer corners and flatter shadows than the
      // public website: they set these variables (see "app-ui" in globals.css).
      borderRadius: {
        lg: 'var(--r-lg, 0.5rem)',
        xl: 'var(--r-xl, 0.75rem)',
        '2xl': 'var(--r-2xl, 1rem)',
        '3xl': 'var(--r-3xl, 1.5rem)',
        '4xl': '2rem',
        '5xl': '2.75rem',
      },
      boxShadow: {
        card: 'var(--shadow-card, 0 1px 2px rgba(26,26,44,.05), 0 4px 16px -4px rgba(26,26,44,.08))',
        lift: 'var(--shadow-lift, 0 2px 4px rgba(26,26,44,.06), 0 18px 40px -12px rgba(63,52,143,.28))',
        glow: '0 12px 40px -8px rgba(227,30,36,.35)',
      },
      keyframes: {
        'fade-up': { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'none' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'page-in': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'none' } },
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
        'page-in': 'page-in .28s cubic-bezier(.2,.7,.2,1) both',
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
