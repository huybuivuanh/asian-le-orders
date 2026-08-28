import AsyncStorage from "@react-native-async-storage/async-storage";
import { TakeOutFulfillmentKind } from "@/types/enum";

const LIVE_ORDERS_CACHE_KEY = "@liveOrders:cache";
const ORDER_HISTORY_CACHE_KEY = "@orderHistory:cache";

// Mirrors ORDER_HISTORY_LIMIT in services/orders.ts. Enforced here too so a
// stale/oversized cache entry (e.g. written by a future version with a
// higher limit) can never render more than intended before the live
// snapshot overwrites it.
const ORDER_HISTORY_CACHE_LIMIT = 100;

// Revive Date fields that were flattened to ISO strings by JSON.stringify.
function reviveOrder(order: Order): Order {
  return {
    ...order,
    createdAt: new Date(order.createdAt),
    fulfillment:
      order.fulfillment?.kind === TakeOutFulfillmentKind.Scheduled
        ? {
            ...order.fulfillment,
            scheduledAt: new Date(order.fulfillment.scheduledAt),
          }
        : order.fulfillment,
  } as Order;
}

async function saveCache(key: string, orders: Order[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(orders));
  } catch (error) {
    console.error(`❌ ordersCache.save [${key}]:`, error);
  }
}

async function loadCache(key: string): Promise<Order[] | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return (JSON.parse(raw) as Order[]).map(reviveOrder);
  } catch (error) {
    console.error(`❌ ordersCache.load [${key}]:`, error);
    return null;
  }
}

// Coalesce rapid snapshot updates (busy live-order traffic) into one write per key.
const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();
function debouncedSaveCache(key: string, orders: Order[]) {
  const existing = saveTimers.get(key);
  if (existing) clearTimeout(existing);
  saveTimers.set(
    key,
    setTimeout(() => {
      void saveCache(key, orders);
      saveTimers.delete(key);
    }, 500),
  );
}

export function saveLiveOrdersCache(orders: Order[]): void {
  debouncedSaveCache(LIVE_ORDERS_CACHE_KEY, orders);
}

export function loadLiveOrdersCache(): Promise<Order[] | null> {
  return loadCache(LIVE_ORDERS_CACHE_KEY);
}

export function saveOrderHistoryCache(orders: Order[]): void {
  debouncedSaveCache(
    ORDER_HISTORY_CACHE_KEY,
    orders.slice(0, ORDER_HISTORY_CACHE_LIMIT),
  );
}

export async function loadOrderHistoryCache(): Promise<Order[] | null> {
  const orders = await loadCache(ORDER_HISTORY_CACHE_KEY);
  return orders ? orders.slice(0, ORDER_HISTORY_CACHE_LIMIT) : null;
}
