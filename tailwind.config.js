const { colors } = require("./src/theme/colors");

/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./App.tsx",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Same names as the website / website admin Tailwind themes.
      colors: {
        ink: colors.ink,
        "ink-raised": colors.inkRaised,
        "ink-line": colors.inkLine,
        "on-ink": colors.onInk,
        "on-ink-muted": colors.onInkMuted,
        gold: colors.gold,
        foreground: colors.foreground,
      },
    },
  },
  plugins: [],
};
