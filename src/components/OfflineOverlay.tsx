import { Ionicons } from "@expo/vector-icons";
import { Modal, Text, View } from "react-native";

import { useIsOnline } from "@/hooks/useIsOnline";

/**
 * Blocks the app while there's no internet, like AsianLePOS's OfflineBanner.
 * Can't be dismissed; it goes away on its own when the connection is back.
 */
export default function OfflineOverlay() {
  const isOnline = useIsOnline();

  if (isOnline) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
      <View className="flex-1 items-center justify-center bg-black/50 p-4">
        <View className="w-full max-w-sm items-center rounded-xl border border-foreground/10 bg-white p-6 shadow-lg">
          <Ionicons name="wifi-outline" size={40} color="#DC2626" />
          <Text className="mt-4 text-center text-lg font-semibold text-foreground">
            No Internet Connection
          </Text>
          <Text className="mt-2 text-center text-sm text-foreground/60">
            Check your connection. The app will resume automatically when restored.
          </Text>
        </View>
      </View>
    </Modal>
  );
}
