import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#2BB8B0',
          600: '#239e97',
          700: '#1A6085',
          800: '#155e75',
          900: '#134e4a',
        },
        blue: {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#b9dbfe',
          300: '#7cc2fd',
          400: '#36a3f9',
          500: '#1A6085',
          600: '#1A6085',
          700: '#155070',
          800: '#10405a',
          900: '#0c3045',
        },
        purple: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#2BB8B0',
          600: '#239e97',
          700: '#1A6085',
          800: '#155e75',
          900: '#134e4a',
        },
      },
      fontFamily: {
        arabic: ['Noto Sans Arabic', 'Cairo', 'sans-serif'],
        sans: ['Inter', 'Noto Sans Arabic', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #2BB8B0 0%, #1A6085 100%)',
        'gradient-blue': 'linear-gradient(135deg, #2BB8B0 0%, #1A6085 100%)',
        'gradient-card': 'linear-gradient(135deg, #1A6085 0%, #2BB8B0 100%)',
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [forms],
};

