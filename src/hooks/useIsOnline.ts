import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

/** Live network status (same as AsianLePOS's useNetworkStore). Unknown counts as online. */
export function useIsOnline() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(
    () => NetInfo.addEventListener((state) => setIsOnline(state.isConnected ?? true)),
    [],
  );

  return isOnline;
}
