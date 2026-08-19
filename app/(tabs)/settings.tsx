import ConfirmModal from "@/components/ConfirmModal";
import SafeAreaViewWrapper from "@/components/SafeAreaViewWrapper";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [confirmVisible, setConfirmVisible] = useState(false);

  const initial = (user?.email ?? "?").charAt(0).toUpperCase();

  return (
    <SafeAreaViewWrapper includeBottomInset={false}>
      <View className="px-4 pt-6 gap-6">
        <Text className="text-2xl font-bold text-gray-900">Settings</Text>

        <View className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm shadow-black/5">
          <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
            Account
          </Text>
          <View className="flex-row items-center gap-3">
            <View className="w-12 h-12 rounded-full bg-sky-100 items-center justify-center">
              <Text className="text-lg font-bold text-sky-700">
                {initial}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">
                {user?.email ?? "Unknown"}
              </Text>
              <Text className="text-xs text-gray-400 mt-0.5">Signed in</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          className="flex-row items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-50 border border-red-100"
          onPress={() => setConfirmVisible(true)}
        >
          <Ionicons name="log-out-outline" size={18} color="#b91c1c" />
          <Text className="font-bold text-red-700">Log Out</Text>
        </TouchableOpacity>
      </View>

      <ConfirmModal
        visible={confirmVisible}
        message="Log out of this device?"
        onConfirm={() => {
          setConfirmVisible(false);
          signOut();
        }}
        onCancel={() => setConfirmVisible(false)}
      />
    </SafeAreaViewWrapper>
  );
}
