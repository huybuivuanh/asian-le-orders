import { ReactNode } from "react";
import { Platform, View, ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props extends ViewProps {
  children: ReactNode;
  backgroundColor?: string;
  includeTopInset?: boolean;
  includeBottomInset?: boolean;
}

export default function SafeAreaViewWrapper({
  children,
  style,
  backgroundColor = "white",
  includeTopInset = true,
  includeBottomInset = true,
  ...props
}: Props) {
  const insets = useSafeAreaInsets();

  const webLayout =
    Platform.OS === "web"
      ? {
          width: "100%" as const,
          minHeight: "100%" as const,
          alignSelf: "stretch" as const,
        }
      : undefined;

  return (
    <View
      style={[
        {
          flex: 1,
          paddingTop: includeTopInset ? insets.top : 0,
          paddingBottom: includeBottomInset ? insets.bottom : 0,
          backgroundColor,
          ...webLayout,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
