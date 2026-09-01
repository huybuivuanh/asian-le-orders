import * as Updates from "expo-updates";
import { useCallback, useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";

import { newOrderAlertActiveRef } from "@/hooks/useNewOrderAlert";

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;

// Web: any of these on `window` counts as the operator still being here.
const WEB_ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
] as const;

/**
 * Recovers a parked, all-day session by fully reloading the app after
 * INACTIVITY_TIMEOUT_MS with no user activity.
 *
 * This app sits on a powered, always-awake device (see useKeepAwake in
 * app/_layout.tsx) showing Live Orders all day. Over a long session Firestore's
 * in-memory document cache and the JS heap grow until the app is laggy or
 * crashes; a hard reload is the only reset that clears them.
 *
 * - Native: Updates.reloadAsync() after touch-idle, and on returning to the
 *   foreground from a background that lasted at least the timeout.
 * - Web: window.location.replace("/") after DOM-activity-idle, on becoming
 *   visible again after being hidden at least the timeout, and immediately on
 *   an unrecoverable Firestore WebChannel error ("INTERNAL ASSERTION FAILED").
 *   Goes to "/" rather than reload() so the static export doesn't 404 on a
 *   deep route.
 *
 * The reload is skipped while the new-order alert is sounding — the alarm is
 * never cut off; if it's still going at the deadline we wait another interval.
 * No-op in dev (logged instead).
 *
 * Returns a callback to fire on every user interaction to re-arm the timer.
 * Wire it to onTouchStart on a View that wraps the whole app.
 */
export function useInactivityReload(enabled: boolean): () => void {
  const rearmRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!enabled) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    function arm() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(fire, INACTIVITY_TIMEOUT_MS);
    }

    function fire() {
      if (newOrderAlertActiveRef.current) {
        arm(); // alarm still sounding — check back after another interval
        return;
      }
      if (__DEV__) {
        console.log(
          "[useInactivityReload] idle deadline reached (reload skipped in dev)",
        );
        arm();
        return;
      }
      if (Platform.OS === "web") {
        window.location.replace("/");
      } else {
        void Updates.reloadAsync().catch(() => {
          // Updates disabled / unavailable — nothing more we can do.
        });
      }
    }

    rearmRef.current = arm;
    arm();

    if (Platform.OS === "web") {
      const onActivity = () => arm();
      WEB_ACTIVITY_EVENTS.forEach((event) =>
        window.addEventListener(event, onActivity, { passive: true }),
      );

      // Tab hidden then shown again after >= the timeout → reload.
      let hiddenAt: number | null = null;
      const onVisibility = () => {
        if (document.visibilityState === "hidden") {
          hiddenAt ??= Date.now();
        } else if (hiddenAt !== null) {
          const awayMs = Date.now() - hiddenAt;
          hiddenAt = null;
          if (awayMs >= INACTIVITY_TIMEOUT_MS) fire();
        }
      };
      document.addEventListener("visibilitychange", onVisibility);

      // Firestore "INTERNAL ASSERTION FAILED" (c050) = an unrecoverable
      // WebChannel; only a fresh SDK instance (page reload) recovers it.
      let reloadingFromError = false;
      const onRejection = (event: PromiseRejectionEvent) => {
        if (reloadingFromError || __DEV__) return;
        const message: string = event.reason?.message ?? "";
        if (message.includes("INTERNAL ASSERTION FAILED")) {
          reloadingFromError = true;
          window.location.replace("/");
        }
      };
      window.addEventListener("unhandledrejection", onRejection);

      return () => {
        if (timer) clearTimeout(timer);
        WEB_ACTIVITY_EVENTS.forEach((event) =>
          window.removeEventListener(event, onActivity),
        );
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("unhandledrejection", onRejection);
        rearmRef.current = () => {};
      };
    }

    // Native: idle timer above, plus reload on foreground after a long background.
    let backgroundedAt: number | null = null;
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        backgroundedAt ??= Date.now();
        return;
      }
      const awayMs = backgroundedAt === null ? 0 : Date.now() - backgroundedAt;
      backgroundedAt = null;
      if (awayMs >= INACTIVITY_TIMEOUT_MS) fire();
      else arm();
    });

    return () => {
      if (timer) clearTimeout(timer);
      sub.remove();
      rearmRef.current = () => {};
    };
  }, [enabled]);

  return useCallback(() => rearmRef.current(), []);
}
