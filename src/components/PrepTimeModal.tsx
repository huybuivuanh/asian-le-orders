import { useEffect, useState } from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";

const STEP = 1;
const MIN = 0;
const MAX = 120;
const QUICK_OPTIONS = [15, 30, 45, 60];

type PrepTimeModalProps = {
  visible: boolean;
  initialValue: number;
  onSubmit: (value: number) => void;
  onCancel: () => void;
};

export default function PrepTimeModal({
  visible,
  initialValue,
  onSubmit,
  onCancel,
}: PrepTimeModalProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

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
            Set Prep Time
          </Text>

          <View className="flex-row items-center justify-center gap-4 mb-4">
            <TouchableOpacity
              className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center"
              disabled={value <= MIN}
              onPress={() => setValue((prev) => Math.max(MIN, prev - STEP))}
            >
              <Text className="text-lg font-bold text-gray-700">−</Text>
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-gray-900 w-16 text-center">
              {value}
            </Text>
            <TouchableOpacity
              className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center"
              disabled={value >= MAX}
              onPress={() => setValue((prev) => Math.min(MAX, prev + STEP))}
            >
              <Text className="text-lg font-bold text-gray-700">+</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-between gap-2 mb-4">
            {QUICK_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                className={`flex-1 py-2 rounded-md items-center ${value === option ? "bg-sky-600" : "bg-gray-200"}`}
                onPress={() => setValue(option)}
              >
                <Text
                  className={`font-semibold ${value === option ? "text-white" : "text-gray-700"}`}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity
              className="flex-1 py-3 rounded-md items-center bg-gray-200"
              onPress={onCancel}
            >
              <Text className="font-semibold text-gray-700">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 py-3 rounded-md items-center bg-emerald-500"
              onPress={() => onSubmit(value)}
            >
              <Text className="font-semibold text-white">Submit</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
