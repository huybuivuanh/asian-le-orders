import type { ReactNode } from "react";
import { Text, View } from "react-native";

type Props = {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

/** White bordered card with an optional title, like the admin's settings cards. */
export default function Card({ title, description, children, className = "" }: Props) {
  return (
    <View className={`rounded-xl border border-foreground/10 bg-white ${className}`}>
      {title ? (
        <View className="px-4 pt-4">
          <Text className="text-base font-semibold text-foreground">{title}</Text>
          {description ? (
            <Text className="mt-0.5 text-sm text-foreground/60">{description}</Text>
          ) : null}
        </View>
      ) : null}
      <View className="p-4">{children}</View>
    </View>
  );
}
