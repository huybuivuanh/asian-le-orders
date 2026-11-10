import { bizDoc } from "@/lib/business";
import { setDoc } from "firebase/firestore";

/**
 * Copies the order as it is now into onlinePrintQueue, replacing any earlier copy, so a
 * reprint shows later changes (rewards discount removed at pickup, extra charge added).
 * `printed: false` makes the print server print it.
 */
export async function submitOrderToPrintQueue(order: Order) {
  await setDoc(bizDoc("onlinePrintQueue", order.id), { ...order, printed: false });
}
