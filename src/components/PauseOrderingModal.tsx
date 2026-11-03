import { INDEFINITE_PAUSE } from "@/utils/storeSettingsHelpers";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { createElement, useState } from "react";
import { Platform, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import Button from "./ui/Button";
import ModalCard from "./ui/ModalCard";

const HOUR_MS = 60 * 60 * 1000;
const QUICK_PAUSES = [
  { label: "1 hour", hours: 1 },
  { label: "2 hours", hours: 2 },
  { label: "4 hours", hours: 4 },
];

function untilTomorrow(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

function defaultCustomDate(): Date {
  const date = new Date(Date.now() + HOUR_MS);
  date.setSeconds(0, 0);
  return date;
}

type PauseOrderingModalProps = {
  visible: boolean;
  isActive: boolean;
  onSubmit: (until: Date | null) => void;
  onCancel: () => void;
  title?: string;
  subtitle?: string;
  resumeLabel?: string;
  quickLabel?: string;
};

export default function PauseOrderingModal({
  visible,
  isActive,
  onSubmit,
  onCancel,
  title = "Pause Ordering",
  subtitle = "Stop taking new orders for a while",
  resumeLabel = "Resume Ordering Now",
  quickLabel = "Quick Pause",
}: PauseOrderingModalProps) {
  const [customDate, setCustomDate] = useState(defaultCustomDate);
  const [showIosPicker, setShowIosPicker] = useState(false);
  const [wasVisible, setWasVisible] = useState(visible);

  // Reset the custom picker each time the modal transitions closed → open.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setCustomDate(defaultCustomDate());
      setShowIosPicker(false);
    }
  }

  const pickCustomDate = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: customDate,
        mode: "date",
        minimumDate: new Date(),
        onChange: (_event, date) => {
          if (!date) return;
          DateTimePickerAndroid.open({
            value: date,
            mode: "time",
            onChange: (_timeEvent, time) => {
              if (!time) return;
              const merged = new Date(date);
              merged.setHours(time.getHours(), time.getMinutes(), 0, 0);
              onSubmit(merged);
            },
          });
        },
      });
      return;
    }
    setShowIosPicker(true);
  };

  return (
    <ModalCard visible={visible} onClose={onCancel} title={title} message={subtitle}>
      {isActive && <Button label={resumeLabel} onPress={() => onSubmit(null)} className="mb-5" />}

      <SectionLabel>{quickLabel}</SectionLabel>
      <View className="mb-2 flex-row gap-2">
        {QUICK_PAUSES.map((option) => (
          <Button
            key={option.label}
            label={option.label}
            variant="secondary"
            size="sm"
            className="flex-1"
            onPress={() => onSubmit(new Date(Date.now() + option.hours * HOUR_MS))}
          />
        ))}
      </View>
      <View className="mb-5 flex-row gap-2">
        <Button
          label="Until tomorrow"
          variant="secondary"
          size="sm"
          className="flex-1"
          onPress={() => onSubmit(untilTomorrow())}
        />
        <Button
          label="Indefinitely"
          variant="dangerOutline"
          size="sm"
          className="flex-1"
          onPress={() => onSubmit(INDEFINITE_PAUSE)}
        />
      </View>

      <SectionLabel>Custom</SectionLabel>
      {Platform.OS === "web" ? (
        <View className="mb-6 gap-2">
          <WebDateTimeInput value={customDate} onChange={setCustomDate} />
          <Button label="Confirm" size="sm" onPress={() => onSubmit(customDate)} />
        </View>
      ) : (
        <View className="mb-6 gap-2">
          <Button
            label="Pick custom date & time…"
            variant="secondary"
            size="sm"
            onPress={pickCustomDate}
          />
          {Platform.OS === "ios" && showIosPicker && (
            <View>
              <DateTimePicker
                value={customDate}
                mode="datetime"
                display="spinner"
                themeVariant="light"
                textColor={colors.foreground}
                minimumDate={new Date()}
                onChange={(_event, date) => {
                  if (date) setCustomDate(date);
                }}
              />
              <Button label="Confirm" size="sm" onPress={() => onSubmit(customDate)} />
            </View>
          )}
        </View>
      )}

      <View className="flex-row justify-end">
        <Button label="Cancel" variant="secondary" size="sm" onPress={onCancel} />
      </View>
    </ModalCard>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/50">
      {children}
    </Text>
  );
}

// @react-native-community/datetimepicker has no web implementation. The
// browser already ships this exact picker for <input type="datetime-local">,
// so render that directly (via createElement — RN's JSX types don't know
// about "input", but it's only ever mounted on web).
function toDateTimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function WebDateTimeInput({
  value,
  onChange,
}: {
  value: Date;
  onChange: (date: Date) => void;
}) {
  return createElement("input", {
    type: "datetime-local",
    value: toDateTimeLocalValue(value),
    min: toDateTimeLocalValue(new Date()),
    onChange: (event: { target: { value: string } }) => {
      const next = new Date(event.target.value);
      if (!Number.isNaN(next.getTime())) onChange(next);
    },
    style: {
      fontSize: 14,
      padding: 8,
      borderRadius: 8,
      border: "1px solid rgba(23, 23, 23, 0.2)",
      color: colors.foreground,
      width: "100%",
    },
  });
}
