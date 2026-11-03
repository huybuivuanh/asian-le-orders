import { colors } from "@/theme/colors";
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
        className={`mr-3 flex-1 text-base ${isSoldOut ? "text-foreground/40 line-through" : "text-foreground"}`}
        numberOfLines={2}
      >
        {label}
      </Text>
      {/* Decorative — the whole row is the tap target so the switch never
          flips ahead of the confirmation modal. */}
      <View pointerEvents="none">
        <Switch
          value={!isSoldOut}
          trackColor={{ false: colors.off, true: colors.on }}
          thumbColor={colors.white}
          ios_backgroundColor={colors.off}
        />
      </View>
    </TouchableOpacity>
  );
}
