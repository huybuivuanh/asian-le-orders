import { subscribeToOrderHistory } from "@/services/orders";
import { loadOrderHistoryCache, saveOrderHistoryCache } from "@/utils/ordersCache";
import { useEffect, useState } from "react";

const INITIAL_DISPLAY_LIMIT = 30;
const LOAD_MORE_BATCH_SIZE = 20;

export function useOrderHistory() {
  const [fullOrders, setFullOrders] = useState<Order[]>([]);
  const [visibleLimit, setVisibleLimit] = useState(INITIAL_DISPLAY_LIMIT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void loadOrderHistoryCache().then((cached) => {
      if (!cancelled && cached && cached.length > 0) {
        setFullOrders(cached);
        setLoading(false);
      }
    });

    const unsubscribe = subscribeToOrderHistory(
      (data) => {
        setFullOrders(data);
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

  const orders = fullOrders.slice(0, visibleLimit);
  const hasMore = fullOrders.length > orders.length;

  const loadMore = () => {
    if (!hasMore) return;
    setVisibleLimit((prev) => prev + LOAD_MORE_BATCH_SIZE);
  };

  return { orders, loading, hasMore, loadMore };
}
