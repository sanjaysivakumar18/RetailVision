/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#070C18',          // Deepest midnight obsidian
          card: '#0D1527',        // Midnight navy glass card
          cardHover: '#111D36',
          border: 'rgba(59, 130, 246, 0.18)',
          borderHover: 'rgba(59, 130, 246, 0.35)',
          sidebar: '#080E1D',
          sidebarCard: '#101B33',
          neonBlue: '#2563EB',
          neonCyan: '#06B6D4',
          neonEmerald: '#10B981',
          neonPurple: '#8B5CF6',
          neonAmber: '#F59E0B',
          neonMagenta: '#EC4899',
        }
      },
      boxShadow: {
        'neon-blue': '0 0 25px -3px rgba(37, 99, 235, 0.45)',
        'neon-cyan': '0 0 25px -3px rgba(6, 182, 212, 0.45)',
        'neon-emerald': '0 0 25px -3px rgba(16, 185, 129, 0.35)',
        'neon-purple': '0 0 25px -3px rgba(139, 92, 246, 0.4)',
        'card-glow': '0 8px 32px 0 rgba(0, 0, 0, 0.36), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
      }
    },
  },
  plugins: [],
}
