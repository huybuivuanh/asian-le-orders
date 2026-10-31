// Asian Le Rewards: the device's rewards login, and collecting points for online orders.
// Online orders are linked to a member at checkout by the website (`order.loyalty`);
// points are collected here when staff complete the order, by calling the rewards
// project's `earnPoints` function — the same one the POS uses. Each call is tied to the
// order id, so retrying never gives points twice.
import { db } from "@/lib/firebase";
import { rewardsAuth, rewardsConfigured, rewardsFunctions } from "@/lib/rewardsFirebase";
import { FirebaseError } from "firebase/app";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type Unsubscribe,
} from "firebase/auth";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

export type RewardsDeviceAuth = {
  configured: boolean;
  /** False until the remembered login has been restored. */
  ready: boolean;
  email: string | null;
  /** True when the signed-in account has the `role: "pos"` claim. */
  isPosAccount: boolean;
};

export function subscribeToRewardsAuth(
  onData: (state: RewardsDeviceAuth) => void,
): Unsubscribe {
  if (!rewardsConfigured || !rewardsAuth) {
    onData({ configured: false, ready: true, email: null, isPosAccount: false });
    return () => {};
  }
  return onAuthStateChanged(rewardsAuth, async (user) => {
    let isPosAccount = false;
    if (user) {
      try {
        isPosAccount = (await user.getIdTokenResult()).claims.role === "pos";
      } catch {
        // Offline: keep the login; the functions check the role anyway.
        isPosAccount = true;
      }
    }
    onData({ configured: true, ready: true, email: user?.email ?? null, isPosAccount });
  });
}

export async function signInRewardsDevice(email: string, password: string) {
  if (!rewardsAuth) throw new Error("Rewards isn't set up in this build.");
  await signInWithEmailAndPassword(rewardsAuth, email.trim(), password);
}

export async function signOutRewardsDevice() {
  if (rewardsAuth) await signOut(rewardsAuth);
}

/** Staff-facing message for a failed rewards sign-in or call. */
export function rewardsErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Email or password is incorrect.";
      case "auth/too-many-requests":
        return "Too many attempts. Wait a few minutes and try again.";
      case "auth/network-request-failed":
      case "functions/unavailable":
      case "functions/deadline-exceeded":
        return "No connection to Rewards. Check the internet and try again.";
      case "functions/unauthenticated":
        return "This device isn't signed in to Rewards. Sign in from Settings → Rewards.";
      case "functions/permission-denied":
        return "This Rewards account doesn't have POS access.";
      case "functions/not-found":
        return "This rewards member no longer exists.";
      case "functions/failed-precondition":
      case "functions/invalid-argument":
        return err.message || "Rewards didn't allow this.";
    }
  }
  if (err instanceof Error && err.message) return err.message;
  return "Rewards request failed. Try again.";
}

/** True if this order is linked to a member and its points haven't been collected yet. */
export function needsPointsCollected(order: Order): boolean {
  return Boolean(order.loyalty?.memberId) && order.loyalty?.collectedAt == null;
}

/** True if points were collected for this order and haven't been removed again. */
export function needsPointsReversed(order: Order): boolean {
  return (
    Boolean(order.loyalty?.memberId) &&
    order.loyalty?.collectedAt != null &&
    order.loyalty?.reversedAt == null
  );
}

export type CollectPointsResult = { pointsEarned: number; bonusPoints: number; balance: number };

/**
 * Earns the order's points for its linked member (1 pt per $1 of the pre-tax subtotal,
 * plus the welcome bonus on a member's first order), then records the result on the order.
 * Throws a staff-facing message on failure. Safe to retry.
 */
export async function collectOrderPoints(order: Order): Promise<CollectPointsResult> {
  const memberId = order.loyalty?.memberId;
  if (!memberId) throw new Error("This order isn't linked to a rewards member.");
  if (!rewardsFunctions) throw new Error("Rewards isn't set up in this build.");

  let result: CollectPointsResult;
  try {
    const response = await httpsCallable<
      { uid: string; orderId: string; subtotal: number },
      { pointsEarned: number; bonusPoints?: number; balance: number }
    >(rewardsFunctions, "earnPoints")({
      uid: memberId,
      orderId: order.id,
      subtotal: order.taxBreakDown.subTotal,
    });
    result = {
      pointsEarned: response.data.pointsEarned,
      bonusPoints: response.data.bonusPoints ?? 0,
      balance: response.data.balance,
    };
  } catch (err) {
    throw new Error(rewardsErrorMessage(err));
  }

  // Same fields as the POS's order.loyalty. If this write fails, collecting again is
  // harmless: earnPoints returns the first result.
  await updateDoc(doc(db, "orders", order.id), {
    "loyalty.pointsEarned": result.pointsEarned + result.bonusPoints,
    "loyalty.collectedAt": serverTimestamp(),
  });
  return result;
}

/**
 * Cancelling an order whose points were already collected: removes them from the member
 * (rewards `reverseOrder`, once per order — safe to retry), then records it on the order.
 * Throws a staff-facing message on failure.
 */
export async function reverseOrderPoints(order: Order): Promise<number> {
  const memberId = order.loyalty?.memberId;
  if (!memberId) throw new Error("This order isn't linked to a rewards member.");
  if (!rewardsFunctions) throw new Error("Rewards isn't set up in this build.");

  let pointsChanged: number;
  try {
    const response = await httpsCallable<
      { uid: string; orderId: string },
      { pointsChanged: number; balance: number }
    >(rewardsFunctions, "reverseOrder")({ uid: memberId, orderId: order.id });
    pointsChanged = response.data.pointsChanged;
  } catch (err) {
    throw new Error(rewardsErrorMessage(err));
  }

  await updateDoc(doc(db, "orders", order.id), {
    "loyalty.reversedAt": serverTimestamp(),
    "loyalty.pointsReversed": pointsChanged,
    "loyalty.reversePending": false,
  });
  return pointsChanged;
}

/** Staff cancelled anyway after removing the points failed — flag it for a retry. */
export async function markReversePending(order: Order): Promise<void> {
  await updateDoc(doc(db, "orders", order.id), { "loyalty.reversePending": true });
}
