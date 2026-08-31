import { formatPausedUntil } from "@/utils/storeSettingsHelpers";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";

type PausedStatusModalProps = {
  visible: boolean;
  pausedUntil: Date | null;
  onResume: () => void;
  onChangePause: () => void;
  onDismiss: () => void;
};

export default function PausedStatusModal({
  visible,
  pausedUntil,
  onResume,
  onChangePause,
  onDismiss,
}: PausedStatusModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-black/60 px-6"
        onPress={onDismiss}
      >
        <Pressable
          className="w-full max-w-sm rounded-xl bg-white p-6"
          onPress={() => {}}
        >
          <View className="items-center mb-3">
            <View className="w-14 h-14 rounded-full bg-amber-100 items-center justify-center mb-3">
              <Text className="text-2xl">⏸</Text>
            </View>
            <Text className="text-lg font-bold text-gray-800">
              Ordering Paused
            </Text>
          </View>

          <Text className="text-sm text-gray-500 text-center mb-5">
            New orders are not being accepted
            {pausedUntil ? ` ${formatPausedUntil(pausedUntil)}` : ""}.
          </Text>

          <TouchableOpacity
            className="py-3 rounded-md items-center bg-emerald-500 mb-2"
            onPress={onResume}
          >
            <Text className="font-semibold text-white">
              Resume Ordering Now
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="py-3 rounded-md items-center bg-gray-200 mb-2"
            onPress={onChangePause}
          >
            <Text className="font-semibold text-gray-700">Change Pause Time</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="py-3 rounded-md items-center"
            onPress={onDismiss}
          >
            <Text className="font-semibold text-gray-500">Dismiss</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
