// Web-only navigation bar. Native apps use NativeTabs instead.
// A header across the top with the app name on the left:
// - wide screens: the tabs sit on the right
// - narrow screens (phone browsers): a hamburger button opens the tabs as a menu
import { useIsWide } from "@/hooks/useIsWide";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { TABS } from "./tabs";

const ACTIVE_COLOR = "#2563EB"; // blue-600
const MUTED_COLOR = "#71717A"; // zinc-500
const TEXT_COLOR = "#09090B"; // zinc-950

export function WebTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const wide = useIsWide();
  const [menuOpen, setMenuOpen] = useState(false);

  const tabs = state.routes.map((route, i) => ({
    route,
    label: descriptors[route.key]?.options.title ?? route.name,
    icon: TABS.find((tab) => tab.name === route.name)?.ionicon,
    focused: state.index === i,
  }));

  // Same press handling as the default tab bar.
  const goTo = (tab: (typeof tabs)[number]) => {
    const event = navigation.emit({
      type: "tabPress",
      target: tab.route.key,
      canPreventDefault: true,
    });
    if (!tab.focused && !event.defaultPrevented) {
      navigation.navigate(tab.route.name, tab.route.params);
    }
  };

  const showMenu = menuOpen && !wide;

  return (
    <View className="border-b border-zinc-200 bg-white" style={{ paddingTop: insets.top }}>
      <View className="h-16 w-full max-w-[1200px] flex-row items-center justify-between self-center px-6">
        <Text className="text-[20px] font-bold text-zinc-950" accessibilityRole="header">
          Asian Le Orders
        </Text>

        {wide ? (
          <View className="flex-row items-center gap-1" accessibilityRole="tablist">
            {tabs.map((tab) => (
              <Pressable
                key={tab.route.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab.focused }}
                onPress={() => goTo(tab)}
                className={`rounded-full px-4 py-2 ${tab.focused ? "bg-blue-50" : "hover:bg-zinc-100"}`}
              >
                <Text
                  className={`text-[15px] font-semibold ${tab.focused ? "text-blue-600" : "text-zinc-600"}`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showMenu ? "Close menu" : "Open menu"}
            accessibilityState={{ expanded: showMenu }}
            onPress={() => setMenuOpen((open) => !open)}
            hitSlop={8}
            className="-mr-2 rounded-full p-2 hover:bg-zinc-100"
          >
            <Ionicons name={showMenu ? "close" : "menu"} size={24} color={TEXT_COLOR} />
          </Pressable>
        )}
      </View>

      {/* Opens below the header and pushes the page down, like a website's mobile menu */}
      {showMenu && (
        <View className="border-t border-zinc-100 px-3 pb-3 pt-2" accessibilityRole="menu">
          {tabs.map((tab) => (
            <Pressable
              key={tab.route.key}
              accessibilityRole="menuitem"
              accessibilityState={{ selected: tab.focused }}
              onPress={() => {
                goTo(tab);
                setMenuOpen(false);
              }}
              className={`h-12 flex-row items-center gap-3 rounded-xl px-3 ${
                tab.focused ? "bg-blue-50" : "hover:bg-zinc-100"
              }`}
            >
              {tab.icon && (
                <Ionicons
                  name={tab.icon}
                  size={24}
                  color={tab.focused ? ACTIVE_COLOR : MUTED_COLOR}
                />
              )}
              <Text
                className={`text-[17px] font-semibold ${tab.focused ? "text-blue-600" : "text-zinc-950"}`}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
