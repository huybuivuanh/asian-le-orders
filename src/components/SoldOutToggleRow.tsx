import { Switch, Text, TouchableOpacity, View } from "react-native";

type SoldOutToggleRowProps = {
  label: string;
  isSoldOut: boolean;
  onPress: () => void;
};

export default function SoldOutToggleRow({
  label,
  isSoldOut,
  onPress,
}: SoldOutToggleRowProps) {
  return (
    <TouchableOpacity
      className="flex-row items-center justify-between py-4"
      onPress={onPress}
      activeOpacity={0.6}
    >
      <Text
        className="flex-1 mr-3 text-base text-gray-900"
        numberOfLines={2}
      >
        {label}
      </Text>
      {/* Decorative — the whole row is the tap target so the switch never
          flips ahead of the confirmation modal. */}
      <View pointerEvents="none">
        <Switch
          value={!isSoldOut}
          trackColor={{ false: "#e5e7eb", true: "#10b981" }}
          thumbColor="#ffffff"
          ios_backgroundColor="#e5e7eb"
        />
      </View>
    </TouchableOpacity>
  );
}
