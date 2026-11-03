import type { Ionicons } from "@expo/vector-icons";

// The app's tabs, in order. Both the native tab bar and the web tab bar
// are built from this list, so add or rename tabs here only.
// - sf: SF Symbol (iOS)
// - md: Material icon (Android)
// - ionicon: Ionicons glyph (web)
export const TABS = [
  {
    name: "index",
    label: "Live Orders",
    sf: "takeoutbag.and.cup.and.straw.fill",
    md: "fastfood",
    ionicon: "fast-food",
  },
  {
    name: "history",
    label: "Order History",
    sf: "clock.fill",
    md: "history",
    ionicon: "time",
  },
  {
    name: "menu",
    label: "Menu",
    sf: "fork.knife",
    md: "restaurant_menu",
    ionicon: "restaurant",
  },
  {
    name: "settings",
    label: "Settings",
    sf: "gearshape.fill",
    md: "settings",
    ionicon: "settings",
  },
] as const satisfies readonly {
  name: string;
  label: string;
  sf: string;
  md: string;
  ionicon: keyof typeof Ionicons.glyphMap;
}[];
