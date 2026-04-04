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
        body: ['JetBrains Mono', 'monospace'],
        headline: ['JetBrains Mono', 'monospace'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        background: '#020202',
        foreground: '#F5F5F5',
        card: {
          DEFAULT: '#0A0A0A',
          foreground: '#F5F5F5',
        },
        popover: {
          DEFAULT: '#0A0A0A',
          foreground: '#F5F5F5',
        },
        primary: {
          DEFAULT: '#E11D48',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#1A1A1A',
          foreground: '#E11D48',
        },
        muted: {
          DEFAULT: '#111111',
          foreground: '#666666',
        },
        accent: {
          DEFAULT: '#E11D48',
          foreground: '#FFFFFF',
        },
        destructive: {
          DEFAULT: '#991B1B',
          foreground: '#FFFFFF',
        },
        border: '#1F1F1F',
        input: '#0A0A0A',
        ring: '#E11D48',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#E11D48',
        stealth: {
          ebon: '#020202',
          onyx: '#0A0A0A',
          crimson: '#E11D48',
          slate: '#1F1F1F'
        }
      },
      borderRadius: {
        lg: '0px',
        md: '0px',
        sm: '0px',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 2px #E11D48)' },
          '50%': { opacity: '0.5', filter: 'drop-shadow(0 0 10px #E11D48)' },
        },
        'scanline': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        }
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      transitionTimingFunction: {
        'mechanical': 'cubic-bezier(0.4, 0, 0.2, 1)',
      }
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
