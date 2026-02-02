/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 温暖有机色调
        cream: {
          50: '#fdfbf7',
          100: '#faf6ed',
          200: '#f5ecd6',
          300: '#ede0bc',
          400: '#e3d09e',
          500: '#d4b87a',
        },
        terracotta: {
          50: '#fdf8f6',
          100: '#faede8',
          200: '#f5d8cd',
          300: '#edbaa8',
          400: '#e0937a',
          500: '#d47252',
          600: '#c55d3d',
          700: '#a44a2f',
          800: '#873e2b',
          900: '#703628',
        },
        forest: {
          50: '#f4f7f4',
          100: '#e3ebe3',
          200: '#c5d8c5',
          300: '#9bbd9b',
          400: '#729c72',
          500: '#527f52',
          600: '#3e633e',
          700: '#334f33',
          800: '#2b3f2b',
          900: '#243524',
        },
        sand: {
          50: '#faf9f7',
          100: '#f5f3ef',
          200: '#e8e4dc',
          300: '#d9d2c5',
          400: '#c4baa8',
          500: '#b0a38c',
          600: '#968a75',
          700: '#7d7362',
          800: '#665e52',
          900: '#544e45',
        },
        // 主色调
        primary: {
          50: '#fdf8f6',
          100: '#faede8',
          200: '#f5d8cd',
          300: '#edbaa8',
          400: '#e0937a',
          500: '#d47252',
          600: '#c55d3d',
          700: '#a44a2f',
          800: '#873e2b',
          900: '#703628',
        },
      },
      fontFamily: {
        // 优雅的衬线字体用于标题
        display: ['Playfair Display', 'Georgia', 'serif'],
        // 清晰的无衬线字体用于正文
        body: ['Inter', 'system-ui', 'sans-serif'],
        // 手写风格用于装饰
        hand: ['Caveat', 'cursive'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.08)',
        'soft-lg': '0 10px 40px -4px rgba(0, 0, 0, 0.1)',
        'warm': '0 4px 20px -2px rgba(196, 93, 61, 0.15)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.04)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 10px 40px -4px rgba(0, 0, 0, 0.12)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
