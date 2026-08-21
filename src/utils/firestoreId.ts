const AUTO_ID_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** Matches the shape of a Firestore-generated document ID (20 random chars)
 * without touching Firestore — for client-only ids like ad hoc OrderItems
 * that never get their own document. */
export function generateFirestoreId(): string {
  let id = "";
  for (let i = 0; i < 20; i++) {
    id += AUTO_ID_ALPHABET.charAt(
      Math.floor(Math.random() * AUTO_ID_ALPHABET.length),
    );
  }
  return id;
}
