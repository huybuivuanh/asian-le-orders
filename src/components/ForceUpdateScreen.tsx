import { Linking, Text, View } from "react-native";
import Button from "./ui/Button";
import Wordmark from "./ui/Wordmark";

export default function ForceUpdateScreen({
  updateUrl,
}: {
  updateUrl?: string;
}) {
  return (
    <View className="flex-1 items-center justify-center bg-white px-8">
      <View className="mb-8">
        <Wordmark tone="light" size="lg" />
      </View>
      <Text className="mb-2 text-center text-xl font-semibold text-foreground">
        Update required
      </Text>
      <Text className="mb-6 text-center text-base text-foreground/60">
        A new version of this app is required to continue. Please update to
        keep using it.
      </Text>
      {updateUrl && (
        <Button
          label="Update now"
          onPress={() => Linking.openURL(updateUrl)}
          className="px-8"
        />
      )}
    </View>
  );
}
