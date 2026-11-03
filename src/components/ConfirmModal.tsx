import { View } from "react-native";
import Button from "./ui/Button";
import ModalCard from "./ui/ModalCard";

type ConfirmModalProps = {
  visible: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button, for destructive actions. */
  danger?: boolean;
};

export default function ConfirmModal({
  visible,
  message,
  onConfirm,
  onCancel,
  title,
  confirmLabel = "Yes",
  cancelLabel = "No",
  danger = false,
}: ConfirmModalProps) {
  return (
    <ModalCard visible={visible} onClose={onCancel} title={title} message={message}>
      <View className="flex-row justify-end gap-2">
        <Button label={cancelLabel} variant="secondary" size="sm" onPress={onCancel} />
        <Button
          label={confirmLabel}
          variant={danger ? "danger" : "primary"}
          size="sm"
          onPress={onConfirm}
        />
      </View>
    </ModalCard>
  );
}
