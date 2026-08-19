// This app only ever toggles soldOutUntil (a temporary, manual "86 this
// item" switch). The weekly `Availability` schedule is a longer-term
// concern owned by the admin panel/website — this app doesn't gate on it,
// so an item can show "Available" here even while outside its scheduled
// hours elsewhere.
export type SoldOutStatus =
  | { state: "available" }
  | { state: "sold-out"; until: Date };

export function isSoldOutNow(
  soldOutUntil: Date | undefined,
  now: Date = new Date(),
): boolean {
  return soldOutUntil != null && soldOutUntil.getTime() > now.getTime();
}

export function getSoldOutStatus(
  entity: { soldOutUntil?: Date },
  now: Date = new Date(),
): SoldOutStatus {
  if (isSoldOutNow(entity.soldOutUntil, now)) {
    return { state: "sold-out", until: entity.soldOutUntil as Date };
  }
  return { state: "available" };
}
