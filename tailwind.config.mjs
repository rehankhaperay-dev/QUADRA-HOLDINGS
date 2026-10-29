/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter Variable', 'system-ui', 'sans-serif'] },
      colors: {
        canvas: '#F7F8F5', surface: '#EEF2ED', white: '#FFFFFF',
        emerald: '#159B72', 'emerald-deep': '#087A59', 'emerald-light': '#DDF4E9',
        amber: '#D6A65D', cream: '#F4EBDD', ink: '#17251F',
        secondary: '#65736B', muted: '#89948D', line: '#E0E7E1',
      },
    },
  },
  plugins: [],
};
