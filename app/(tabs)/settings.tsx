import SafeAreaViewWrapper from "@/components/SafeAreaViewWrapper";
import { Text } from "react-native";

export default function SettingsScreen() {
  return (
    <SafeAreaViewWrapper
      className="items-center justify-center"
      includeBottomInset={false}
    >
      <Text className="text-xl font-bold text-blue-500">Settings</Text>
    </SafeAreaViewWrapper>
  );
}
