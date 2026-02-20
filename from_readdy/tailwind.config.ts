import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        sage: {
          DEFAULT: '#A8B89F',
          dark: '#8FA080',
        },
        peach: {
          DEFAULT: '#FFD4C4',
        },
        cream: {
          DEFAULT: '#FFF8F0',
        },
        charcoal: {
          DEFAULT: '#2C2C2C',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
