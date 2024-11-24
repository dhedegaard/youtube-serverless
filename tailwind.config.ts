import daisyui, { type Config as DaisyConfig } from 'daisyui'
import type { Config } from 'tailwindcss/types/config'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  /** @type {import('daisyui').Config} */
  daisyui: {
    logs: false,
  } satisfies DaisyConfig,
} satisfies Config
