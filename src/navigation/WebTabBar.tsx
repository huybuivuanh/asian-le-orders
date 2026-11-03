// Web-only navigation bar. Native apps use NativeTabs instead.
// Dark "ink" header with gold accents, same as the website admin's navbar:
// - wide screens: the tabs sit on the right
// - narrow screens (phone browsers): a hamburger button opens the tabs as a menu
import Wordmark from "@/components/ui/Wordmark";
import { useIsWide } from "@/hooks/useIsWide";
import { colors } from "@/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { TABS } from "./tabs";

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
    <View className="border-b border-ink-line bg-ink" style={{ paddingTop: insets.top }}>
      <View className="h-16 w-full max-w-[1280px] flex-row items-center justify-between self-center px-4">
        <Wordmark tone="dark" />

        {wide ? (
          <View className="flex-row items-center gap-5" accessibilityRole="tablist">
            {tabs.map((tab) => (
              <Pressable
                key={tab.route.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab.focused }}
                onPress={() => goTo(tab)}
                className="rounded-md py-2"
              >
                <Text
                  className={`text-[15px] font-medium hover:text-gold ${
                    tab.focused ? "text-gold" : "text-on-ink"
                  }`}
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
            className="-mr-2 h-11 w-11 items-center justify-center rounded-full hover:bg-ink-raised"
          >
            <Ionicons name={showMenu ? "close" : "menu"} size={24} color={colors.onInk} />
          </Pressable>
        )}
      </View>

      {/* Opens below the header and pushes the page down, like the admin's mobile menu */}
      {showMenu && (
        <View className="border-t border-ink-line px-4 pb-4 pt-3" accessibilityRole="menu">
          {tabs.map((tab) => (
            <Pressable
              key={tab.route.key}
              accessibilityRole="menuitem"
              accessibilityState={{ selected: tab.focused }}
              onPress={() => {
                goTo(tab);
                setMenuOpen(false);
              }}
              className="flex-row items-center gap-3 rounded-xl px-3 py-3.5 hover:bg-ink-raised"
            >
              {tab.icon && (
                <Ionicons
                  name={tab.icon}
                  size={22}
                  color={tab.focused ? colors.gold : colors.onInkMuted}
                />
              )}
              <Text
                className={`text-base font-semibold ${tab.focused ? "text-gold" : "text-on-ink"}`}
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
