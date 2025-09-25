/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        primaryLight: '#60a5fa',
        primaryDark: '#1e40af',
        secondary: '#6366f1',
        success: '#10b981',
        successLight: '#6ee7b7',
        error: '#ef4444',
        errorLight: '#fca5a5',
        warning: '#f59e0b',
        warningLight: '#fde68a',
        info: '#0ea5e9',
        infoLight: '#7dd3fc',
        background: '#f3f4f6',
        card: '#ffffff'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace']
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem'
      },
      boxShadow: {
        card: '0 10px 15px rgba(0,0,0,0.1)',
        cardHover: '0 20px 25px rgba(0,0,0,0.15)',
        modal: '0 25px 50px rgba(0,0,0,0.25)'
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio')
  ]
}
