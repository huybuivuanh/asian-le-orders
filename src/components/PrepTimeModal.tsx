import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Button from "./ui/Button";
import ModalCard from "./ui/ModalCard";

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
  const [wasVisible, setWasVisible] = useState(visible);

  // Re-seed from initialValue each time the modal transitions closed → open.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setValue(initialValue);
  }

  return (
    <ModalCard
      visible={visible}
      onClose={onCancel}
      title="Prep time"
      message="Default ready time for new orders, in minutes."
    >
      <View className="mb-4 flex-row items-center justify-center gap-4">
        <StepButton
          label="−"
          disabled={value <= MIN}
          onPress={() => setValue((prev) => Math.max(MIN, prev - STEP))}
        />
        <Text className="w-16 text-center text-2xl font-semibold text-foreground">
          {value}
        </Text>
        <StepButton
          label="+"
          disabled={value >= MAX}
          onPress={() => setValue((prev) => Math.min(MAX, prev + STEP))}
        />
      </View>

      <View className="mb-6 flex-row justify-between gap-2">
        {QUICK_OPTIONS.map((option) => (
          <Pressable
            key={option}
            className={`flex-1 items-center rounded-lg border py-2 ${
              value === option
                ? "border-foreground bg-foreground"
                : "border-foreground/15 bg-white"
            }`}
            onPress={() => setValue(option)}
          >
            <Text
              className={`text-sm font-medium ${value === option ? "text-white" : "text-foreground"}`}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="flex-row justify-end gap-2">
        <Button label="Cancel" variant="secondary" size="sm" onPress={onCancel} />
        <Button label="Save" size="sm" onPress={() => onSubmit(value)} />
      </View>
    </ModalCard>
  );
}

function StepButton({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={`h-10 w-10 items-center justify-center rounded-full border border-foreground/15 ${
        disabled ? "opacity-40" : ""
      }`}
      disabled={disabled}
      onPress={onPress}
    >
      <Text className="text-lg font-semibold text-foreground">{label}</Text>
    </Pressable>
  );
}
