import { subscribeToOrderHistory } from "@/services/orders";
import { loadOrderHistoryCache, saveOrderHistoryCache } from "@/utils/ordersCache";
import { useEffect, useState } from "react";

export function useOrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void loadOrderHistoryCache().then((cached) => {
      if (!cancelled && cached && cached.length > 0) {
        setOrders(cached);
        setLoading(false);
      }
    });

    const unsubscribe = subscribeToOrderHistory(
      (data) => {
        setOrders(data);
        setLoading(false);
        saveOrderHistoryCache(data);
      },
      (error) => {
        console.error("Order history snapshot error:", error);
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
