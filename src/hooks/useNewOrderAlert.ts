import { subscribeToLiveOrders } from "@/services/orders";
import { OrderStatus } from "@/types/enum";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import { useEffect, useRef, useState } from "react";

const NEW_ORDER_SOUND = require("../../assets/sounds/new-order.mp3");

export function useNewOrderAlert() {
  const [alerting, setAlerting] = useState(false);
  const seenIdsRef = useRef<Set<string> | null>(null);
  const player = useAudioPlayer(NEW_ORDER_SOUND);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch((error) => {
      console.error("Failed to set audio mode:", error);
    });
  }, []);

  useEffect(() => {
    // Skip the first snapshot — it's existing orders on mount, not new ones.
    const unsubscribe = subscribeToLiveOrders(
      (orders) => {
        const currentIds = new Set(orders.map((o) => o.id));
        if (seenIdsRef.current) {
          const hasNewOrder = orders.some(
            (o) =>
              o.status === OrderStatus.New && !seenIdsRef.current!.has(o.id),
          );
          if (hasNewOrder) setAlerting(true);
        }
        seenIdsRef.current = currentIds;
      },
      (error) => {
        console.error("New order alert snapshot error:", error);
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (alerting) {
      player.loop = true;
      player.play();
    } else {
      player.pause();
    }
  }, [alerting, player]);

  const dismiss = () => setAlerting(false);

  return { alerting, dismiss };
}
