import { db } from "@/lib/firebase";
import { OrderStatus, TakeOutFulfillmentKind } from "@/types/enum";
import {
  type DocumentData,
  type FirestoreError,
  type Unsubscribe,
  Timestamp,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

const ORDER_HISTORY_LIMIT = 100;

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  return value as Date;
}

function mapOrderDoc(id: string, data: DocumentData): Order {
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

export function subscribeToLiveOrders(
  onData: (orders: Order[]) => void,
  onError: (error: FirestoreError) => void,
): Unsubscribe {
  const q = query(
    collection(db, "orders"),
    where("status", "in", [
      OrderStatus.New,
      OrderStatus.InProgress,
      OrderStatus.ReadyForPickup,
    ]),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs.map((docSnap) =>
        mapOrderDoc(docSnap.id, docSnap.data()),
      );
      orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      onData(orders);
    },
    onError,
  );
}

export function subscribeToOrderHistory(
  onData: (orders: Order[]) => void,
  onError: (error: FirestoreError) => void,
): Unsubscribe {
  const q = query(
    collection(db, "orders"),
    orderBy("createdAt", "desc"),
    limit(ORDER_HISTORY_LIMIT),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onData(
        snapshot.docs.map((docSnap) => mapOrderDoc(docSnap.id, docSnap.data())),
      );
    },
    onError,
  );
}

export async function acceptOrder(order: Order, readyTimeMinutes?: number) {
  const updates: Record<string, unknown> = { status: OrderStatus.InProgress };

  if (
    order.fulfillment?.kind === TakeOutFulfillmentKind.Immediate &&
    readyTimeMinutes != null
  ) {
    updates["fulfillment.readyTimeMinutes"] = readyTimeMinutes;
  }

  await updateDoc(doc(db, "orders", order.id), updates);
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  await updateDoc(doc(db, "orders", orderId), { status });
}
