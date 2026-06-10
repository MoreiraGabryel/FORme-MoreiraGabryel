import type {Config} from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,js,jsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0A',
        surface: '#111111',
        accent: '#E8FF00',
        primary: '#FFFFFF',
        muted: '#555555'
      },
      fontFamily: {
        sans: ['Inter', 'Arial', 'Helvetica', 'sans-serif']
      },
      keyframes: {
        scrollPulse: {
          '0%, 100%': {transform: 'translateY(0)', opacity: '0.35'},
          '50%': {transform: 'translateY(10px)', opacity: '1'}
        }
      },
      animation: {
        scrollPulse: 'scrollPulse 1.4s ease-in-out infinite'
      }
    }
  },
  plugins: []
};

export default config;
