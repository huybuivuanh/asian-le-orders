import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export async function submitOrderToPrintQueue(order: Order) {
  const printQueueRef = doc(db, "printQueue", order.id);
  const existingSnap = await getDoc(printQueueRef);

  if (existingSnap.exists()) {
    await updateDoc(printQueueRef, { printed: false });
    return;
  }

  await setDoc(printQueueRef, { ...order, printed: false });
}
