// Brand colors shared with the website and website admin (asian-le-website,
// asian-le-website-admin). CommonJS so tailwind.config.js can use it too.
// In className use the Tailwind names (bg-ink, text-gold, text-foreground,
// border-foreground/10, …). Use these raw values only where classes can't
// go: icon colors, Switch colors, placeholders, navigation options.
const colors = {
  // Dark surfaces (header bar)
  ink: "#141210",
  inkRaised: "#1d1a17",
  inkLine: "#2e2925",
  // Text on dark surfaces
  onInk: "#f3eee6",
  onInkMuted: "#b8b0a4",
  // Accent on dark surfaces
  gold: "#d4b26a",
  // Text and primary buttons on light surfaces
  foreground: "#171717",
  muted: "#737373", // foreground at ~60%
  placeholder: "#a3a3a3",
  white: "#ffffff",
  // Switch "on" (green-500, same as the admin's toggles)
  on: "#22c55e",
  off: "#e5e5e5",
};

module.exports = { colors };
