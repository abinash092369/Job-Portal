/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3730A3', // Deep Indigo
          light: '#4F46E5',
          dark: '#312E81',
          50: '#EEF2F6',
          100: '#E0E7FF',
          600: '#4F46E5',
          700: '#3730A3',
          800: '#312E81',
        },
        slate: {
          DEFAULT: '#1E293B', // Slate
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        accent: {
          DEFAULT: '#F59E0B', // Amber
          light: '#FBBF24',
          dark: '#D97706',
        },
        background: {
          DEFAULT: '#F8FAFC', // Off-white
        },
        success: {
          DEFAULT: '#10B981', // Emerald
        },
        error: {
          DEFAULT: '#EF4444', // Rose
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 4px 20px -2px rgba(17, 24, 39, 0.05), 0 2px 6px -1px rgba(17, 24, 39, 0.02)',
        'premium-hover': '0 10px 25px -3px rgba(17, 24, 39, 0.08), 0 4px 12px -2px rgba(17, 24, 39, 0.03)',
      }
    },
  },
  plugins: [],
}
