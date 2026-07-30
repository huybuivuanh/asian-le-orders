import { db } from "@/lib/firebase";
import { mapOrderDoc } from "@/utils/orderHelpers";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

const ORDER_HISTORY_LIMIT = 100;

export function useOrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc"),
      limit(ORDER_HISTORY_LIMIT),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setOrders(
          snapshot.docs.map((docSnap) => mapOrderDoc(docSnap.id, docSnap.data())),
        );
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
