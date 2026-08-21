import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type ExtraChargeModalProps = {
  visible: boolean;
  onSubmit: (name: string, price: number) => void;
  onCancel: () => void;
};

export default function ExtraChargeModal({
  visible,
  onSubmit,
  onCancel,
}: ExtraChargeModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    if (visible) {
      setName("");
      setPrice("");
    }
  }, [visible]);

  const parsedPrice = Number(price);
  const isValid =
    name.trim().length > 0 &&
    price.trim().length > 0 &&
    Number.isFinite(parsedPrice) &&
    parsedPrice > 0;

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit(name.trim(), parsedPrice);
  };

  // Strips anything that isn't a digit or decimal point, and collapses to at
  // most one decimal point, so the field can never hold non-numeric text —
  // matters on web, where keyboardType doesn't restrict typed/pasted input.
  const handlePriceChange = (text: string) => {
    const digitsAndDots = text.replace(/[^0-9.]/g, "");
    const firstDot = digitsAndDots.indexOf(".");
    const sanitized =
      firstDot === -1
        ? digitsAndDots
        : digitsAndDots.slice(0, firstDot + 1) +
          digitsAndDots.slice(firstDot + 1).replace(/\./g, "");
    setPrice(sanitized);
  };

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
            Add Extra Charge
          </Text>

          <Text className="text-sm font-semibold text-gray-700 mb-1">
            Name
          </Text>
          <TextInput
            className="border border-gray-300 rounded-md px-3 py-2 mb-3 text-base text-gray-900"
            placeholder="e.g. Extra Sauce"
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={setName}
          />

          <Text className="text-sm font-semibold text-gray-700 mb-1">
            Price
          </Text>
          <TextInput
            className="border border-gray-300 rounded-md px-3 py-2 mb-4 text-base text-gray-900"
            placeholder="0.00"
            placeholderTextColor="#9ca3af"
            value={price}
            onChangeText={handlePriceChange}
            keyboardType="decimal-pad"
          />

          <View className="flex-row gap-2">
            <TouchableOpacity
              className="flex-1 py-3 rounded-md items-center bg-gray-200"
              onPress={onCancel}
            >
              <Text className="font-semibold text-gray-700">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3 rounded-md items-center ${isValid ? "bg-emerald-500" : "bg-emerald-300"}`}
              onPress={handleSubmit}
              disabled={!isValid}
            >
              <Text className="font-semibold text-white">Submit</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
