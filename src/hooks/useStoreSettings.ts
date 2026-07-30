import {
  DEFAULT_STORE_SETTINGS,
  subscribeToStoreSettings,
} from "@/services/storeSettings";
import { useEffect, useState } from "react";

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings>(
    DEFAULT_STORE_SETTINGS,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToStoreSettings(
      (data) => {
        setSettings(data);
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
