import { subscribeToOrderHistory } from "@/services/orders";
import { useEffect, useState } from "react";

export function useOrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToOrderHistory(
      (data) => {
        setOrders(data);
        setLoading(false);
      },
      (error) => {
        console.error("Order history snapshot error:", error);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return { orders, loading };
}
