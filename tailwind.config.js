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
  // "class" instead of the default "media": the app is light-only (no dark:
  // classes), and with "media" react-native-css-interop throws "Cannot manually
  // set color scheme" on web when the stylesheet loads after the JS.
  darkMode: "class",
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
