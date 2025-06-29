import daisyui, { type Config as DaisyConfig } from 'daisyui'
import type { Config } from 'tailwindcss/types/config'

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  /** @type {import('daisyui').Config} */
  daisyui: {
    logs: false,
    themes: ['light'],
  } satisfies DaisyConfig,
} satisfies Config
