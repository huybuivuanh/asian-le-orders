import { Image } from "expo-image";
import { Text, View } from "react-native";

type Props = {
  /** "dark": on the ink header (light text). "light": on a white screen (ink text). */
  tone?: "dark" | "light";
  size?: "md" | "lg";
};

const SIZES = {
  md: { text: "text-xl", label: "text-xs", logo: { width: 28, height: 40 } },
  lg: { text: "text-3xl", label: "text-sm", logo: { width: 36, height: 52 } },
};

/** "ASIAN [Vietnam map] LE ORDERS" — the suite's logo, same as the website and admin. */
export default function Wordmark({ tone = "dark", size = "md" }: Props) {
  const s = SIZES[size];
  const textColor = tone === "dark" ? "text-on-ink" : "text-ink";

  return (
    <View
      className="flex-row items-center gap-1"
      accessible
      accessibilityRole="header"
      accessibilityLabel="Asian Le Orders"
    >
      <Text className={`${s.text} font-extrabold tracking-wide ${textColor}`}>ASIAN</Text>
      <Image source={require("../../../assets/logo.png")} style={s.logo} contentFit="contain" />
      <Text className={`${s.text} font-extrabold tracking-wide ${textColor}`}>LE</Text>
      <Text
        className={`ml-1 ${s.label} font-bold uppercase tracking-widest ${
          tone === "dark" ? "text-gold" : "text-foreground/60"
        }`}
      >
        Orders
      </Text>
    </View>
  );
}
