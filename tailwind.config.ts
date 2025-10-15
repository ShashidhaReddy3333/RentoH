import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2FB79A',
          blue: '#1E88E5',
          green: '#43A047',
          yellow: '#F9A825',
          dark: '#212121',
          bg: '#F5F5F5',
          white: '#FFFFFF'
        },
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          muted: 'rgb(var(--surface-muted) / <alpha-value>)'
        },
        textc: {
          DEFAULT: 'rgb(var(--text) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)'
        },
        border: 'rgb(0 0 0 / 0.12)'
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        lg: '12px',
        md: '8px'
      },
      boxShadow: {
        soft: '0 8px 24px rgba(0,0,0,0.08)',
        glass: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 8px 24px rgba(0,0,0,0.15)',
        card: '0 4px 24px rgba(0,0,0,0.06)'
      }
    }
  },
  plugins: []
};

export default config;
