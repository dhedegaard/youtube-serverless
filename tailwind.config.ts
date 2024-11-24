import type { Config } from 'tailwindcss/types/config'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
  /** @type {import('daisyui').Config} */
  daisyui: {
    themes: ['light'],
    logs: false,
  },
} satisfies Config
