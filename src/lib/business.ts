// The business this Orders app works in. All data lives under businesses/{businessId}/…
// in the shared asianlepos Firebase project.
//
// The id comes from the signed-in account's `businessId` custom claim. It's saved on the
// device so the app can restart offline (expired token) for the same account.
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "firebase/auth";
import { collection, doc } from "firebase/firestore";
import { db } from "./firebase";

const STORAGE_KEY = "@business";
// Who can use the Orders app: staff and admins. Customers (rewards accounts) have no role.
const STAFF_ROLES = ["staff", "admin"];

type SavedBusiness = { uid: string; businessId: string };

let currentBusinessId: string | null = null;

export type Access = { ok: true; businessId: string } | { ok: false; message: string };

/** Checks the account's claims and, if it may use the Orders app, sets its business. */
export async function checkAccessAndSetBusiness(user: User): Promise<Access> {
  let access: Access;
  try {
    const { claims } = await user.getIdTokenResult();
    const businessId = claims.businessId;
    access =
      typeof businessId === "string" &&
      businessId &&
      typeof claims.role === "string" &&
      STAFF_ROLES.includes(claims.role)
        ? { ok: true, businessId }
        : { ok: false, message: "This account doesn't have Orders app access. Ask an admin to set it up." };
  } catch {
    // Offline with an expired token: trust the business saved for this same account.
    const saved = await loadSaved();
    access =
      saved?.uid === user.uid
        ? { ok: true, businessId: saved.businessId }
        : { ok: false, message: "Couldn't check this account. Connect to the internet and try again." };
  }

  if (access.ok) {
    currentBusinessId = access.businessId;
    const saved: SavedBusiness = { uid: user.uid, businessId: access.businessId };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saved)).catch(() => {});
  }
  return access;
}

async function loadSaved(): Promise<SavedBusiness | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedBusiness) : null;
  } catch {
    return null;
  }
}

function requireBusinessId(): string {
  if (!currentBusinessId) throw new Error("No business selected. Sign out and sign in again.");
  return currentBusinessId;
}

/** A collection inside the current business, e.g. bizCol("orders"). */
export function bizCol(name: string) {
  return collection(db, "businesses", requireBusinessId(), name);
}

/** A doc inside the current business, e.g. bizDoc("orders", id). */
export function bizDoc(name: string, id: string) {
  return doc(db, "businesses", requireBusinessId(), name, id);
}
