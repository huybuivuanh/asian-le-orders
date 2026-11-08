import { bizDoc } from "@/lib/business";
import { INDEFINITE_PAUSE } from "@/utils/storeSettingsHelpers";
import {
  Timestamp,
  type DocumentData,
  type FirestoreError,
  type Unsubscribe,
  onSnapshot,
  setDoc,
} from "firebase/firestore";

// A function, not a constant: the business is only known after sign-in.
const storeSettingsDoc = () => bizDoc("settings", "store");

const DEFAULT_DAY_HOURS: DayHours = {
  isOpen: false,
  open: "00:00",
  close: "00:00",
};

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  pausedUntil: INDEFINITE_PAUSE,
  timezone: "America/Regina",
  waitTime: 0,
  hours: {
    mon: DEFAULT_DAY_HOURS,
    tue: DEFAULT_DAY_HOURS,
    wed: DEFAULT_DAY_HOURS,
    thu: DEFAULT_DAY_HOURS,
    fri: DEFAULT_DAY_HOURS,
    sat: DEFAULT_DAY_HOURS,
    sun: DEFAULT_DAY_HOURS,
  },
  holidays: [],
  restaurantPhoneNumber: "",
};

function mapStoreSettingsDoc(data: DocumentData): StoreSettings {
  const pausedUntil = data.pausedUntil;
  return {
    ...data,
    pausedUntil:
      pausedUntil instanceof Timestamp ? pausedUntil.toDate() : pausedUntil ?? null,
  } as StoreSettings;
}

export function subscribeToStoreSettings(
  onData: (settings: StoreSettings) => void,
  onError: (error: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    storeSettingsDoc(),
    (snapshot) => {
      onData(
        snapshot.exists()
          ? mapStoreSettingsDoc(snapshot.data())
          : DEFAULT_STORE_SETTINGS,
      );
    },
    onError,
  );
}

export async function updateStorePausedUntil(pausedUntil: Date | null) {
  await setDoc(
    storeSettingsDoc(),
    { pausedUntil: pausedUntil ? Timestamp.fromDate(pausedUntil) : null },
    { merge: true },
  );
}

export async function updateStoreWaitTime(waitTime: number) {
  await setDoc(storeSettingsDoc(), { waitTime }, { merge: true });
}
