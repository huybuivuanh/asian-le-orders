import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

const STORE_SETTINGS_DOC = doc(db, "settings", "store");

const DEFAULT_DAY_HOURS: DayHours = {
  isOpen: false,
  open: "00:00",
  close: "00:00",
};

const DEFAULT_STORE_SETTINGS: StoreSettings = {
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

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings>(
    DEFAULT_STORE_SETTINGS,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      STORE_SETTINGS_DOC,
      (snapshot) => {
        setSettings(
          snapshot.exists()
            ? (snapshot.data() as StoreSettings)
            : DEFAULT_STORE_SETTINGS,
        );
        setLoading(false);
      },
      (error) => {
        console.error("Store settings snapshot error:", error);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return { settings, loading };
}

export async function updateStoreAcceptingOrders(pauseOrdering: boolean) {
  await setDoc(STORE_SETTINGS_DOC, { pauseOrdering }, { merge: true });
}

export async function updateStoreWaitTime(waitTime: number) {
  await setDoc(STORE_SETTINGS_DOC, { waitTime }, { merge: true });
}
