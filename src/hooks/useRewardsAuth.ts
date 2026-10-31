import { type RewardsDeviceAuth, subscribeToRewardsAuth } from "@/services/rewards";
import { useEffect, useState } from "react";

/** This device's Asian Le Rewards login (Settings → Rewards). */
export function useRewardsAuth(): RewardsDeviceAuth {
  const [state, setState] = useState<RewardsDeviceAuth>({
    configured: true,
    ready: false,
    email: null,
    isPosAccount: false,
  });

  useEffect(() => subscribeToRewardsAuth(setState), []);

  return state;
}
