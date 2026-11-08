import { db } from "@/lib/firebase";
import {
  type FirestoreError,
  type Unsubscribe,
  doc,
  onSnapshot,
} from "firebase/firestore";

export type AppVersionConfig = {
  minVersion?: string;
  iosUpdateUrl?: string;
  androidUpdateUrl?: string;
};

// Top level, shared by every business; each app has its own doc (POS: posVersion).
const APP_VERSION_DOC = doc(db, "appConfig", "ordersVersion");

export function subscribeToAppVersionConfig(
  onData: (config: AppVersionConfig | null) => void,
  onError: (error: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    APP_VERSION_DOC,
    (snapshot) => {
      onData(
        snapshot.exists() ? (snapshot.data() as AppVersionConfig) : null,
      );
    },
    onError,
  );
}
