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
        background: '#121214',
        foreground: '#F5F7FA',
        card: {
          DEFAULT: '#1e1e22',
          foreground: '#F5F7FA',
        },
        popover: {
          DEFAULT: '#1e1e22',
          foreground: '#F5F7FA',
        },
        primary: {
          DEFAULT: '#9494F7',
          foreground: '#121214',
        },
        secondary: {
          DEFAULT: '#252529',
          foreground: '#F5F7FA',
        },
        muted: {
          DEFAULT: '#252529',
          foreground: '#82828C',
        },
        accent: {
          DEFAULT: '#6BCCF2',
          foreground: '#121214',
        },
        destructive: {
          DEFAULT: '#FF6B6B',
          foreground: '#F5F7FA',
        },
        border: 'rgba(255,255,255,0.06)',
        input: '#1e1e22',
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