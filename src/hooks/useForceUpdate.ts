import {
  type AppVersionConfig,
  subscribeToAppVersionConfig,
} from "@/services/appConfig";
import { isVersionLower } from "@/utils/version";
import Constants from "expo-constants";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

/**
 * Live-checks the app version against `appConfig/version` in Firestore (mirrors AsianLePOS).
 * Mounted inside the signed-in (tabs) layout, so the doc is read under the normal auth rules.
 * Uses a live listener so a required update pushed mid-shift takes effect without a relaunch.
 * Skipped on web, which always serves the latest build.
 */
export function useForceUpdate() {
  const [config, setConfig] = useState<AppVersionConfig | null>(null);

  useEffect(() => {
    if (Platform.OS === "web") return;
    return subscribeToAppVersionConfig(setConfig, (error) => {
      console.error("App version config snapshot error:", error);
    });
  }, []);

  const currentVersion = Constants.expoConfig?.version ?? "0.0.0";
  const updateRequired =
    Platform.OS !== "web" &&
    !!config?.minVersion &&
    isVersionLower(currentVersion, config.minVersion);

  const updateUrl =
    Platform.OS === "ios" ? config?.iosUpdateUrl : config?.androidUpdateUrl;

  return { updateRequired, updateUrl };
}
