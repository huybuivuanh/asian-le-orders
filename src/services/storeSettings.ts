import { db } from "@/lib/firebase";
import {
  type FirestoreError,
  type Unsubscribe,
  doc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";

const STORE_SETTINGS_DOC = doc(db, "settings", "store");

const DEFAULT_DAY_HOURS: DayHours = {
  isOpen: false,
  open: "00:00",
  close: "00:00",
};

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  pauseOrdering: true,
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
};

export function subscribeToStoreSettings(
  onData: (settings: StoreSettings) => void,
  onError: (error: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    STORE_SETTINGS_DOC,
    (snapshot) => {
      onData(
        snapshot.exists()
          ? (snapshot.data() as StoreSettings)
          : DEFAULT_STORE_SETTINGS,
      );
    },
    onError,
  );
}

export async function updateStoreAcceptingOrders(pauseOrdering: boolean) {
  await setDoc(STORE_SETTINGS_DOC, { pauseOrdering }, { merge: true });
}

export async function updateStoreWaitTime(waitTime: number) {
  await setDoc(STORE_SETTINGS_DOC, { waitTime }, { merge: true });
}
