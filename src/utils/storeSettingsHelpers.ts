// Sentinel used for "paused indefinitely" so pausedUntil can stay a single
// nullable Date instead of a separate boolean/tri-state field.
export const INDEFINITE_PAUSE = new Date("2099-01-01T00:00:00Z");

export function isStorePaused(settings: StoreSettings): boolean {
  return (
    settings.pausedUntil != null && settings.pausedUntil.getTime() > Date.now()
  );
}

export function formatPausedUntil(pausedUntil: Date): string {
  if (pausedUntil.getTime() === INDEFINITE_PAUSE.getTime()) {
    return "until manually resumed";
  }
  return `until ${pausedUntil.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}
