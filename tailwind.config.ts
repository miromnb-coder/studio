import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        headline: ['Space Grotesk', 'sans-serif'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#8d949e',
          foreground: '#F3F4F6',
        },
        surface: {
          DEFAULT: 'rgba(255, 255, 255, 0.06)',
          strong: 'rgba(255, 255, 255, 0.1)',
          overlay: 'rgba(29, 33, 39, 0.95)',
        },
        slate: {
          900: '#111315',
          500: '#a1a1aa',
          400: '#c9ced6',
          200: '#d4d4d8',
          50: '#f3f4f6',
        },
        success: '#86efac',
        warning: '#facc15',
        danger: '#fb7185',
        border: 'hsl(var(--border))',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        float: '0 8px 32px -4px rgba(0, 0, 0, 0.28)',
        glow: '0 0 20px rgba(180, 186, 196, 0.12)',
      },
      backdropBlur: {
        'xs': '2px',
        'xl': '20px',
        '2xl': '40px',
      }
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
