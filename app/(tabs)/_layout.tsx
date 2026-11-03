import ForceUpdateScreen from "@/components/ForceUpdateScreen";
import { useForceUpdate } from "@/hooks/useForceUpdate";
import { TABS } from "@/navigation/tabs";
import { WebTabBar } from "@/navigation/WebTabBar";
import { Tabs } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Platform } from "react-native";

export default function TabLayout() {
  const { updateRequired, updateUrl } = useForceUpdate();

  if (updateRequired) {
    return <ForceUpdateScreen updateUrl={updateUrl} />;
  }

  return Platform.OS === "web" ? <WebTabs /> : <AppTabs />;
}

// iOS / Android: real native tab bar.
function AppTabs() {
  return (
    <NativeTabs>
      {TABS.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={tab.sf} md={tab.md} />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}

// Web: NativeTabs floats over the page there, so use a website-style header
// (tabs on wide screens, a hamburger menu in phone browsers).
function WebTabs() {
  return (
    <Tabs
      tabBar={(props) => <WebTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarPosition: "top",
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.label }} />
      ))}
    </Tabs>
  );
}
