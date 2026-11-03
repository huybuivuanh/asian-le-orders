import * as Sentry from "@sentry/react-native";
import { useKeepAwake } from "expo-keep-awake";
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from "react-native-safe-area-context";

import NewOrderAlertOverlay from "@/components/NewOrderAlertOverlay";
import OfflineOverlay from "@/components/OfflineOverlay";
import SafeAreaViewWrapper from "@/components/SafeAreaViewWrapper";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useInactivityReload } from "@/hooks/useInactivityReload";

import "../global.css";

Sentry.init({
  // DSN is not a secret — it only permits sending events to this project.
  dsn: "https://123ebbd1e990cf683e0442a51ff6f824@o4512046229094400.ingest.us.sentry.io/4512046248099840",
  // No PII (no emails/IPs) attached to events.
  sendDefaultPii: false,
  // Crash/error reporting only — no performance tracing, to stay well within
  // the free quota.
  tracesSampleRate: 0,
  // Keep the last 100 console.* calls, network requests, and navigations as
  // breadcrumbs so a rare crash shows what led up to it.
  maxBreadcrumbs: 100,
  environment: __DEV__ ? "development" : "production",
});

function RootNavigator() {
  const { user, initializing } = useAuth();
  const notifyActivity = useInactivityReload(!!user);

  if (initializing) {
    return (
      <SafeAreaViewWrapper className="items-center justify-center">
        <ActivityIndicator />
      </SafeAreaViewWrapper>
    );
  }

  return (
    <View style={{ flex: 1 }} onTouchStart={notifyActivity}>
      <Stack>
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="menu-item/[id]" />
        </Stack.Protected>
        <Stack.Protected guard={!user}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
      {user && <NewOrderAlertOverlay />}
      <OfflineOverlay />
    </View>
  );
}

function RootLayout() {
  useKeepAwake();

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

// Sentry.wrap adds the error boundary + native crash hooks around the app.
export default Sentry.wrap(RootLayout);
