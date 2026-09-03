import OrderCard from "@/components/OrderCard";
import PauseOrderingModal from "@/components/PauseOrderingModal";
import PausedStatusModal from "@/components/PausedStatusModal";
import PrepTimeModal from "@/components/PrepTimeModal";
import SafeAreaViewWrapper from "@/components/SafeAreaViewWrapper";
import { useLiveOrders } from "@/hooks/useLiveOrders";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import {
  updateStorePausedUntil,
  updateStoreWaitTime,
} from "@/services/storeSettings";
import { formatPausedUntil, isStorePaused } from "@/utils/storeSettingsHelpers";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const LIST_STYLE = {
  flex: 1,
  minHeight: 0,
  width: "100%" as const,
  alignSelf: "stretch" as const,
};

const LIST_CONTENT_STYLE = {
  flexGrow: 1,
  alignSelf: "stretch" as const,
  width: "100%" as const,
  padding: 16,
};

export default function LiveOrdersScreen() {
  const { orders, loading } = useLiveOrders();
  const { settings, loading: settingsLoading } = useStoreSettings();
  const isPaused = isStorePaused(settings);

  const [pauseModalVisible, setPauseModalVisible] = useState(false);
  const [pausedInfoVisible, setPausedInfoVisible] = useState(false);
  const [prepTimeVisible, setPrepTimeVisible] = useState(false);

  // Surface the paused-status modal whenever the store enters the paused
  // state; hide it once ordering resumes. Dismissing it doesn't fight this
  // effect because isPaused hasn't changed. Wait for the real settings snapshot
  // first — DEFAULT_STORE_SETTINGS seeds pausedUntil to the INDEFINITE_PAUSE
  // sentinel, which would otherwise flash the modal open on every app launch.
  useEffect(() => {
    if (settingsLoading) return;
    setPausedInfoVisible(isPaused);
  }, [isPaused, settingsLoading]);

  const handleSelectPause = async (pausedUntil: Date | null) => {
    setPauseModalVisible(false);
    try {
      await updateStorePausedUntil(pausedUntil);
    } catch (error) {
      console.error("Failed to update store status:", error);
    }
  };

  const handleSubmitPrepTime = async (value: number) => {
    setPrepTimeVisible(false);
    try {
      await updateStoreWaitTime(value);
    } catch (error) {
      console.error("Failed to update prep time:", error);
    }
  };

  return (
    <SafeAreaViewWrapper includeBottomInset={false}>
      <View className="flex-row gap-2 px-4 pt-4">
        <TouchableOpacity
          className={`flex-row items-center gap-1.5 px-4 py-2 rounded-full ${isPaused ? "bg-gray-400" : "bg-emerald-500"}`}
          onPress={() =>
            isPaused ? setPausedInfoVisible(true) : setPauseModalVisible(true)
          }
        >
          <Text className="text-white text-xs">●</Text>
          <Text className="text-white font-semibold text-sm">
            {isPaused && settings.pausedUntil
              ? `Paused ${formatPausedUntil(settings.pausedUntil)}`
              : "Accepting"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center gap-1.5 px-4 py-2 rounded-full bg-sky-600"
          onPress={() => setPrepTimeVisible(true)}
        >
          <Text className="text-white text-xs">⏱</Text>
          <Text className="text-white font-semibold text-sm">
            {settings.waitTime} min
          </Text>
        </TouchableOpacity>
      </View>

      <PauseOrderingModal
        visible={pauseModalVisible}
        isActive={isPaused}
        onSubmit={handleSelectPause}
        onCancel={() => setPauseModalVisible(false)}
      />

      <PausedStatusModal
        visible={pausedInfoVisible}
        pausedUntil={settings.pausedUntil ?? null}
        onResume={() => {
          setPausedInfoVisible(false);
          void handleSelectPause(null);
        }}
        onChangePause={() => {
          setPausedInfoVisible(false);
          setPauseModalVisible(true);
        }}
        onDismiss={() => setPausedInfoVisible(false)}
      />

      <PrepTimeModal
        visible={prepTimeVisible}
        initialValue={settings.waitTime}
        onSubmit={handleSubmitPrepTime}
        onCancel={() => setPrepTimeVisible(false)}
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : orders.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-base text-gray-500">No live orders</Text>
        </View>
      ) : (
        <FlatList
          style={LIST_STYLE}
          contentContainerStyle={LIST_CONTENT_STYLE}
          data={orders}
          keyExtractor={(order) => order.id}
          renderItem={({ item }) => (
            <OrderCard order={item} defaultReadyMinutes={settings.waitTime} />
          )}
        />
      )}
    </SafeAreaViewWrapper>
  );
}
