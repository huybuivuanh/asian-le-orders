import { useNewOrderAlert } from "@/hooks/useNewOrderAlert";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

export default function NewOrderAlertOverlay() {
  const { alerting, dismiss } = useNewOrderAlert();

  if (!alerting) return null;

  return (
    <Pressable
      onPress={dismiss}
      className="absolute inset-0 items-center justify-center bg-black/60"
    >
      <View className="mx-8 items-center gap-3 rounded-xl border border-foreground/10 bg-white px-8 py-8 shadow-lg">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-purple-100">
          <Ionicons name="notifications" size={28} color="#9333ea" />
        </View>
        <Text className="text-lg font-semibold text-foreground">New Order!</Text>
        <Text className="text-sm text-foreground/60">Tap anywhere to dismiss</Text>
      </View>
    </Pressable>
  );
}
