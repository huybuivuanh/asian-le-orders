import { useKeepAwake } from "expo-keep-awake";
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from "react-native-safe-area-context";

import NewOrderAlertOverlay from "@/components/NewOrderAlertOverlay";
import SafeAreaViewWrapper from "@/components/SafeAreaViewWrapper";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import "../global.css";

function RootNavigator() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <SafeAreaViewWrapper className="items-center justify-center">
        <ActivityIndicator />
      </SafeAreaViewWrapper>
    );
  }

  return (
    <View style={{ flex: 1 }}>
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
    </View>
  );
}

export default function RootLayout() {
  useKeepAwake();

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
