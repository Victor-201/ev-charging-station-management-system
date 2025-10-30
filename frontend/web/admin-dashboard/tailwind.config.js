/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        "ev-black": "#000000",
        "ev-gunmetal": "#001A1A",
        "ev-deep": "#004D4D",
        "ev-teal": "#008080",
        "ev-cyan": "#00B3B3",
        "ev-ice": "#00E6E6",
        "ev-sky": "#1AFFFF"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"]
      }
    }
  },
  plugins: []
};
