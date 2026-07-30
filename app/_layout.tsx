import { Stack } from "expo-router";
import { ActivityIndicator } from "react-native";
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from "react-native-safe-area-context";

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
    <Stack>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
