/** @type {import('tailwindcss').Config} */
module.exports = {
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
}
