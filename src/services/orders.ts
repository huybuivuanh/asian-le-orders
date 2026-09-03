import { db } from "@/lib/firebase";
import { KitchenType, OrderStatus, TakeOutFulfillmentKind } from "@/types/enum";
import { generateFirestoreId } from "@/utils/firestoreId";
import { calculateTaxBreakdown } from "@/utils/orderPricing";
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
  if (value instanceof Date) return value;
  if (value && typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === "number") return new Date(value);
  // Missing / pending value. A brand-new order from the customer-facing site
  // is written with serverTimestamp(); Firestore's latency-compensated first
  // snapshot delivers createdAt as null before the server resolves it. Fall
  // back to "now" so mapping and the client-side createdAt sort can't throw.
  return new Date();
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

// A snapshot callback that throws crashes the whole app (in a release build an
// uncaught error here is fatal — it takes down the RN runtime, not just this
// screen). The `orders` collection is written by a separate repo, so one
// malformed doc must never be able to do that: map each doc defensively and
// drop the ones that fail rather than letting the exception escape.
function mapOrderDocsSafely(snapshot: {
  docs: { id: string; data: (options?: object) => DocumentData }[];
}): Order[] {
  const orders: Order[] = [];
  for (const docSnap of snapshot.docs) {
    try {
      orders.push(
        mapOrderDoc(docSnap.id, docSnap.data({ serverTimestamps: "estimate" })),
      );
    } catch (error) {
      console.error(`Skipping unmappable order doc ${docSnap.id}:`, error);
    }
  }
  return orders;
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
      const orders = mapOrderDocsSafely(snapshot);
      orders.sort(
        (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
      );
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
      onData(mapOrderDocsSafely(snapshot));
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

// Lets the restaurant add a line item (e.g. a customer-noted extra) before
// accepting an order. menuItemId is a client-only id — this item never
// traces back to a real MenuItem doc.
export async function addExtraCharge(order: Order, name: string, price: number) {
  const newItem: OrderItem = {
    menuItemId: generateFirestoreId(),
    name,
    price,
    quantity: 1,
    kitchenType: KitchenType.Other,
  };
  const orderItems = [...order.orderItems, newItem];
  const subTotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxBreakDown = calculateTaxBreakdown(subTotal);

  await updateDoc(doc(db, "orders", order.id), { orderItems, taxBreakDown });
}
