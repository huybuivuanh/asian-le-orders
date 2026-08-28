import { subscribeToLiveOrders } from "@/services/orders";
import { loadLiveOrdersCache, saveLiveOrdersCache } from "@/utils/ordersCache";
import { useEffect, useState } from "react";

export function useLiveOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void loadLiveOrdersCache().then((cached) => {
      if (!cancelled && cached && cached.length > 0) {
        setOrders(cached);
        setLoading(false);
      }
    });

    const unsubscribe = subscribeToLiveOrders(
      (data) => {
        setOrders(data);
        setLoading(false);
        saveLiveOrdersCache(data);
      },
      (error) => {
        console.error("Live orders snapshot error:", error);
        setLoading(false);
      },
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return { orders, loading };
}
