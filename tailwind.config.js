/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#F4F4F0',
        'brand-green': '#CCFF00',
        'brand-orange': '#FF4911',
        'brand-purple': '#B088F9',
        'brand-blue': '#5CE1E6',
        'brand-yellow': '#FFE600',
      },
      borderWidth: {
        '4': '4px',
      },
    },
  },
  plugins: [],
}
