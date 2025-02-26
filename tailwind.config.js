module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",  // Entwicklungsquellen
    "./build/static/**/*.{js,jsx,ts,tsx}",  // Produktionsquellen
    "./build/index.html"  // Produktions-HTML
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}