import { subscribeToLiveOrders } from "@/services/orders";
import { useEffect, useState } from "react";

export function useLiveOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToLiveOrders(
      (data) => {
        setOrders(data);
        setLoading(false);
      },
      (error) => {
        console.error("Live orders snapshot error:", error);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return { orders, loading };
}
