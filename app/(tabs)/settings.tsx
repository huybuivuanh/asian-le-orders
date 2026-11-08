import ConfirmModal from "@/components/ConfirmModal";
import SafeAreaViewWrapper from "@/components/SafeAreaViewWrapper";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [confirmVisible, setConfirmVisible] = useState(false);

  const initial = (user?.email ?? "?").charAt(0).toUpperCase();

  return (
    <SafeAreaViewWrapper includeBottomInset={false}>
      <ScrollView contentContainerClassName="w-full max-w-2xl self-center gap-4 px-4 py-6">
        <Text className="text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </Text>

        <Card title="Account">
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-ink">
              <Text className="text-lg font-bold text-gold">{initial}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">
                {user?.email ?? "Unknown"}
              </Text>
              <Text className="mt-0.5 text-sm text-foreground/60">Signed in</Text>
            </View>
          </View>
        </Card>

        <Button
          label="Sign out"
          variant="dangerOutline"
          onPress={() => setConfirmVisible(true)}
        />
      </ScrollView>

      <ConfirmModal
        visible={confirmVisible}
        title="Sign out"
        message="Sign out of this device?"
        confirmLabel="Sign out"
        cancelLabel="Cancel"
        danger
        onConfirm={() => {
          setConfirmVisible(false);
          signOut();
        }}
        onCancel={() => setConfirmVisible(false)}
      />
    </SafeAreaViewWrapper>
  );
}
