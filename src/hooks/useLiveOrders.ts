import { db } from "@/lib/firebase";
import { OrderStatus } from "@/types/enum";
import {
  collection,
  type DocumentData,
  onSnapshot,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  return value as Date;
}

function mapOrder(id: string, data: DocumentData): Order {
  return {
    ...data,
    id,
    createdAt: toDate(data.createdAt),
    fulfillment:
      data.fulfillment?.kind === "scheduled"
        ? {
            ...data.fulfillment,
            scheduledAt: toDate(data.fulfillment.scheduledAt),
          }
        : data.fulfillment,
  } as Order;
}

export function useLiveOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      where("status", "in", [OrderStatus.New, OrderStatus.InProgress]),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) =>
          mapOrder(docSnap.id, docSnap.data()),
        );
        data.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        );
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
