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
          DEFAULT: 'hsl(210, 100%, 60%)',
          foreground: '#FFFFFF',
        },
        surface: {
          DEFAULT: 'rgba(255, 255, 255, 0.6)',
          strong: 'rgba(255, 255, 255, 0.8)',
          overlay: 'rgba(255, 255, 255, 0.95)',
        },
        slate: {
          900: '#1A1C1E',
          500: '#64748B',
          400: '#94A3B8',
          200: '#E2E8F0',
          50: '#F8FAFC',
        },
        success: 'hsl(142, 71%, 45%)',
        warning: 'hsl(38, 92%, 50%)',
        danger: 'hsl(0, 84%, 60%)',
        border: 'hsl(var(--border))',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        float: '0 8px 32px -4px rgba(0, 0, 0, 0.04)',
        glow: '0 0 20px rgba(59, 130, 246, 0.1)',
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
