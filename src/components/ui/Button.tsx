import { ActivityIndicator, Pressable, Text } from "react-native";
import { colors } from "@/theme/colors";

// Same button styles as the website admin (primaryButtonClass / secondaryButtonClass,
// red-600 for danger).
const VARIANTS = {
  primary: { box: "bg-foreground", text: "text-white", spinner: colors.white },
  secondary: {
    box: "border border-foreground/20 bg-white",
    text: "text-foreground",
    spinner: colors.foreground,
  },
  danger: { box: "bg-red-600", text: "text-white", spinner: colors.white },
  dangerOutline: {
    box: "border border-red-600/30 bg-white",
    text: "text-red-600",
    spinner: "#dc2626",
  },
  ghost: { box: "", text: "text-foreground/60", spinner: colors.foreground },
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

type Props = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: "md" | "sm";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
};

export default function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  className = "",
}: Props) {
  const v = VARIANTS[variant];
  const sizeBox = size === "md" ? "min-h-11 px-4 py-3" : "min-h-9 px-3 py-2";
  const sizeText = size === "md" ? "text-base" : "text-sm";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      onPress={onPress}
      disabled={disabled || loading}
      className={`items-center justify-center rounded-lg active:opacity-80 ${sizeBox} ${v.box} ${
        disabled ? "opacity-50" : ""
      } ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={v.spinner} />
      ) : (
        <Text className={`font-medium ${sizeText} ${v.text}`}>{label}</Text>
      )}
    </Pressable>
  );
}
