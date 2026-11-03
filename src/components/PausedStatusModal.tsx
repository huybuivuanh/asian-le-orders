import { formatPausedUntil } from "@/utils/storeSettingsHelpers";
import { View } from "react-native";
import Button from "./ui/Button";
import ModalCard from "./ui/ModalCard";

type PausedStatusModalProps = {
  visible: boolean;
  pausedUntil: Date | null;
  onResume: () => void;
  onChangePause: () => void;
  onDismiss: () => void;
};

export default function PausedStatusModal({
  visible,
  pausedUntil,
  onResume,
  onChangePause,
  onDismiss,
}: PausedStatusModalProps) {
  return (
    <ModalCard
      visible={visible}
      onClose={onDismiss}
      title="Ordering paused"
      message={`New orders are not being accepted${
        pausedUntil ? ` ${formatPausedUntil(pausedUntil)}` : ""
      }.`}
    >
      <View className="gap-2">
        <Button label="Resume ordering now" onPress={onResume} />
        <Button label="Change pause time" variant="secondary" onPress={onChangePause} />
        <Button label="Dismiss" variant="ghost" onPress={onDismiss} />
      </View>
    </ModalCard>
  );
}
