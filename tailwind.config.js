/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy brand (kept for backwards compat during migration)
        brand: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        // Obsidian Ledger design system
        ob: {
          bg:      '#0D0E12',
          surface: '#141620',
          raised:  '#1C1E2A',
          border:  '#252738',
          text:    '#F0EBE1',
          muted:   '#8E8EA0',
          dim:     '#4E4E60',
          amber:   '#E8A020',
          green:   '#4ADE80',
          red:     '#F87171',
        },
      },
      fontFamily: {
        syne: ['"Syne Variable"', 'Syne', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"DM Sans Variable"', '"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
