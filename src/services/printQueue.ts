import { bizDoc } from "@/lib/business";
import { getDoc, setDoc, updateDoc } from "firebase/firestore";

export async function submitOrderToPrintQueue(order: Order) {
  const printQueueRef = bizDoc("onlinePrintQueue", order.id);
  const existingSnap = await getDoc(printQueueRef);

  if (existingSnap.exists()) {
    await updateDoc(printQueueRef, { printed: false });
    return;
  }

  await setDoc(printQueueRef, { ...order, printed: false });
}
