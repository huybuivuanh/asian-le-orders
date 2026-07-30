import ConfirmModal from "@/components/ConfirmModal";
import OrderCard from "@/components/OrderCard";
import PrepTimeModal from "@/components/PrepTimeModal";
import SafeAreaViewWrapper from "@/components/SafeAreaViewWrapper";
import { useLiveOrders } from "@/hooks/useLiveOrders";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import {
  updateStoreAcceptingOrders,
  updateStoreWaitTime,
} from "@/services/storeSettings";
import { useState } from "react";
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
  const { settings } = useStoreSettings();
  const isAccepting = !settings.pauseOrdering;

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [prepTimeVisible, setPrepTimeVisible] = useState(false);

  const handleConfirmSwitch = async () => {
    setConfirmVisible(false);
    try {
      await updateStoreAcceptingOrders(!settings.pauseOrdering);
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
          className={`flex-row items-center gap-1.5 px-4 py-2 rounded-full ${isAccepting ? "bg-emerald-500" : "bg-gray-400"}`}
          onPress={() => setConfirmVisible(true)}
        >
          <Text className="text-white text-xs">●</Text>
          <Text className="text-white font-semibold text-sm">
            {isAccepting ? "Accepting" : "Paused"}
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

      <ConfirmModal
        visible={confirmVisible}
        message={`Switch status to ${isAccepting ? "Paused" : "Accepting"}?`}
        onConfirm={handleConfirmSwitch}
        onCancel={() => setConfirmVisible(false)}
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
