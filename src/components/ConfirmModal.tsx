import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";

type ConfirmModalProps = {
  visible: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  visible,
  message,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-black/50 px-6"
        onPress={onCancel}
      >
        <Pressable
          className="w-full max-w-sm rounded-xl bg-white p-5"
          onPress={() => {}}
        >
          <Text className="text-base font-semibold text-gray-800 text-center mb-4">
            {message}
          </Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="flex-1 py-3 rounded-md items-center bg-gray-200"
              onPress={onCancel}
            >
              <Text className="font-semibold text-gray-700">No</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 py-3 rounded-md items-center bg-emerald-500"
              onPress={onConfirm}
            >
              <Text className="font-semibold text-white">Yes</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
