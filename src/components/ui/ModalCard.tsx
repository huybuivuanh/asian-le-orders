import type { ReactNode } from "react";
import { Modal, Pressable, Text } from "react-native";

type Props = {
  visible: boolean;
  /** Back button / tap outside. */
  onClose: () => void;
  title?: string;
  /** Short text under the title. */
  message?: string;
  children?: ReactNode;
};

/** Centered dialog with a dimmed backdrop, same look as the admin's AppModal. */
export default function ModalCard({ visible, onClose, title, message, children }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 items-center justify-center bg-black/50 p-4" onPress={onClose}>
        {/* Swallow taps so pressing inside the card doesn't close it */}
        <Pressable
          className="w-full max-w-sm rounded-xl border border-foreground/10 bg-white p-6 shadow-lg"
          onPress={() => {}}
        >
          {title ? (
            <Text className="mb-2 text-lg font-semibold text-foreground">{title}</Text>
          ) : null}
          {message ? (
            <Text className="mb-6 text-sm text-foreground/80">{message}</Text>
          ) : null}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
