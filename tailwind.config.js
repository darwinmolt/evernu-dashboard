module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        evernu: {
          dark: '#0f172a',
          card: '#1e293b',
          accent: '#3b82f6',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          muted: '#64748b'
        }
      }
    },
  },
  plugins: [],
}
