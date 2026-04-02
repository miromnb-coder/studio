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
        headline: ['Space Grotesk', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        background: '#19191C',
        foreground: '#F5F7FA',
        card: {
          DEFAULT: '#232327',
          foreground: '#F5F7FA',
        },
        popover: {
          DEFAULT: '#232327',
          foreground: '#F5F7FA',
        },
        primary: {
          DEFAULT: '#9494F7',
          foreground: '#19191C',
        },
        secondary: {
          DEFAULT: '#2C2C31',
          foreground: '#F5F7FA',
        },
        muted: {
          DEFAULT: '#2C2C31',
          foreground: '#A7AFBD',
        },
        accent: {
          DEFAULT: '#6BCCF2',
          foreground: '#19191C',
        },
        destructive: {
          DEFAULT: '#FF6B6B',
          foreground: '#F5F7FA',
        },
        border: 'rgba(255,255,255,0.08)',
        input: '#232327',
        ring: '#9494F7',
        success: '#39D98A',
        warning: '#F5C451',
        danger: '#FF6B6B',
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
