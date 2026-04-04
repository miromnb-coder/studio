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
        body: ['Inter', 'sans-serif'],
        headline: ['Inter', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        background: '#F8F9FA',
        foreground: '#1F2937',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#1F2937',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#1F2937',
        },
        primary: {
          DEFAULT: '#5B6D44',
          foreground: '#F8F9FA',
        },
        secondary: {
          DEFAULT: '#E9EDC6',
          foreground: '#5B6D44',
        },
        muted: {
          DEFAULT: '#F1F5F9',
          foreground: '#64748B',
        },
        accent: {
          DEFAULT: '#E9EDC6',
          foreground: '#5B6D44',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
        border: '#E2E8F0',
        input: '#FFFFFF',
        ring: '#5B6D44',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        nordic: {
          silk: '#F8F9FA',
          sage: '#5B6D44',
          moss: '#E9EDC6',
          slate: '#1F2937'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;