import { INDEFINITE_PAUSE } from "@/utils/storeSettingsHelpers";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { createElement, useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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

  useEffect(() => {
    if (visible) {
      setCustomDate(defaultCustomDate());
      setShowIosPicker(false);
    }
  }, [visible]);

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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-black/60 px-6"
        onPress={onCancel}
      >
        <Pressable
          className="w-full max-w-sm rounded-xl bg-white p-5"
          onPress={() => {}}
        >
          <Text className="text-base font-semibold text-gray-800 text-center mb-1">
            {title}
          </Text>
          <Text className="text-xs text-gray-400 text-center mb-4">
            {subtitle}
          </Text>

          {isActive && (
            <TouchableOpacity
              className="py-3 rounded-md items-center bg-emerald-500 mb-4"
              onPress={() => onSubmit(null)}
            >
              <Text className="font-semibold text-white">{resumeLabel}</Text>
            </TouchableOpacity>
          )}

          <Text className="text-xs font-semibold text-gray-500 mb-2">
            {quickLabel}
          </Text>
          <View className="flex-row gap-2 mb-2">
            {QUICK_PAUSES.map((option) => (
              <TouchableOpacity
                key={option.label}
                className="flex-1 py-2 rounded-md items-center bg-gray-200"
                onPress={() =>
                  onSubmit(new Date(Date.now() + option.hours * HOUR_MS))
                }
              >
                <Text className="font-semibold text-gray-700 text-sm">
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="flex-row gap-2 mb-4">
            <TouchableOpacity
              className="flex-1 py-3 rounded-md items-center bg-gray-200"
              onPress={() => onSubmit(untilTomorrow())}
            >
              <Text className="font-semibold text-gray-700 text-sm">
                Until Tomorrow
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 py-3 rounded-md items-center bg-red-100"
              onPress={() => onSubmit(INDEFINITE_PAUSE)}
            >
              <Text className="font-semibold text-red-700 text-sm">
                Indefinitely
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-xs font-semibold text-gray-500 mb-2">
            Custom
          </Text>

          {Platform.OS === "web" ? (
            <View className="mb-4 gap-2">
              <WebDateTimeInput value={customDate} onChange={setCustomDate} />
              <TouchableOpacity
                className="py-2.5 rounded-md items-center bg-emerald-500"
                onPress={() => onSubmit(customDate)}
              >
                <Text className="font-semibold text-white">Confirm</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="mb-4">
              <TouchableOpacity
                className={`py-2.5 rounded-md items-center bg-gray-200 ${showIosPicker ? "mb-2" : ""}`}
                onPress={pickCustomDate}
              >
                <Text className="font-semibold text-gray-700">
                  Pick Custom Date & Time…
                </Text>
              </TouchableOpacity>

              {Platform.OS === "ios" && showIosPicker && (
                <View>
                  <DateTimePicker
                    value={customDate}
                    mode="datetime"
                    display="spinner"
                    themeVariant="light"
                    textColor="#374151"
                    minimumDate={new Date()}
                    onChange={(_event, date) => {
                      if (date) setCustomDate(date);
                    }}
                  />
                  <TouchableOpacity
                    className="py-2.5 rounded-md items-center bg-emerald-500 mt-2"
                    onPress={() => onSubmit(customDate)}
                  >
                    <Text className="font-semibold text-white">Confirm</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity
            className="py-3 rounded-md items-center bg-gray-200"
            onPress={onCancel}
          >
            <Text className="font-semibold text-gray-700">Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
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
      borderRadius: 6,
      border: "1px solid #d1d5db",
      width: "100%",
    },
  });
}
