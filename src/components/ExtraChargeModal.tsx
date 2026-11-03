import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { colors } from "@/theme/colors";
import Button from "./ui/Button";
import ModalCard from "./ui/ModalCard";

const INPUT_CLASS =
  "rounded-lg border border-foreground/20 bg-white px-3 py-2.5 text-base text-foreground";

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
  const [wasVisible, setWasVisible] = useState(visible);

  // Clear the fields each time the modal transitions closed → open, so a
  // reopened modal never shows the previous entry.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setName("");
      setPrice("");
    }
  }

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
    <ModalCard visible={visible} onClose={onCancel} title="Add extra charge">
      <Text className="mb-1 text-sm font-medium text-foreground">Name</Text>
      <TextInput
        className={`mb-4 ${INPUT_CLASS}`}
        placeholder="e.g. Extra Sauce"
        placeholderTextColor={colors.placeholder}
        value={name}
        onChangeText={setName}
      />

      <Text className="mb-1 text-sm font-medium text-foreground">Price</Text>
      <TextInput
        className={`mb-6 ${INPUT_CLASS}`}
        placeholder="0.00"
        placeholderTextColor={colors.placeholder}
        value={price}
        onChangeText={handlePriceChange}
        keyboardType="decimal-pad"
      />

      <View className="flex-row justify-end gap-2">
        <Button label="Cancel" variant="secondary" size="sm" onPress={onCancel} />
        <Button label="Add charge" size="sm" onPress={handleSubmit} disabled={!isValid} />
      </View>
    </ModalCard>
  );
}
