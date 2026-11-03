import { useWindowDimensions } from "react-native";

/** Tablet / desktop width. Switches the web header between tabs and a hamburger menu. */
export const WIDE_BREAKPOINT = 768;

export function useIsWide(): boolean {
  return useWindowDimensions().width >= WIDE_BREAKPOINT;
}
