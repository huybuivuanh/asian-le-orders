// Asian Le Rewards: settling points for online orders.
// Online orders are linked to a member at checkout by the website (`order.loyalty`). If
// the customer used points for money off, the website only priced the discount
// (`loyalty.pointsToRedeem`); the points are taken here on Complete (`redeemPoints`),
// then the order's points are earned on the discounted subtotal (`earnPoints`) — the same
// rewards functions the POS uses. Each call is tied to the order id, so retrying never
// takes or gives points twice.
import { bizDoc } from "@/lib/business";
import app from "@/lib/firebase";
import { calculateTaxBreakdown } from "@/utils/orderPricing";
import { FirebaseError } from "firebase/app";
import { deleteField, serverTimestamp, updateDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

// The rewards functions run in the same project and are called with the staff login.
// They take the business from the caller's `businessId` claim.
const rewardsFunctions = getFunctions(app);

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
        return "You're signed out. Sign in again to use Rewards.";
      case "functions/permission-denied":
        return "This account can't use Rewards. Ask an admin.";
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

/** Same as the rewards functions / POS: 100 points = $5 off. */
const POINTS_PER_REDEEM_STEP = 100;

/** Thrown when the member no longer has the points they chose at checkout (e.g. spent
 * them at the POS before picking up). Staff then remove or waive the discount. */
export class NotEnoughPointsError extends Error {}

/** True if this order is linked to a member and its points haven't been collected yet. */
export function needsPointsCollected(order: Order): boolean {
  return Boolean(order.loyalty?.memberId) && order.loyalty?.collectedAt == null;
}

/** True if the customer used points at checkout and they haven't been taken yet. */
export function needsPointsRedeemed(order: Order): boolean {
  const l = order.loyalty;
  return (
    Boolean(l?.memberId) &&
    (l?.pointsToRedeem ?? 0) > 0 &&
    l?.pointsRedeemed == null &&
    !l?.redeemWaived
  );
}

/** Anything left to do on Complete: take used points and/or collect earned points. */
export function needsRewardsSettled(order: Order): boolean {
  return needsPointsRedeemed(order) || needsPointsCollected(order);
}

/** True if points were taken or given for this order and haven't been undone. */
export function needsPointsReversed(order: Order): boolean {
  const l = order.loyalty;
  return (
    Boolean(l?.memberId) &&
    (l?.collectedAt != null || l?.pointsRedeemed != null) &&
    l?.reversedAt == null
  );
}

/** Pre-tax amount after any discount — what points are earned on (same as the POS). */
export function earnableSubtotal(order: Order): number {
  return order.taxBreakDown.discount?.taxableSubtotal ?? order.taxBreakDown.subTotal;
}

/**
 * Takes the points the customer chose at checkout from their balance, then records it
 * on the order (same fields as the POS). Throws NotEnoughPointsError if they no longer
 * have enough, otherwise a staff-facing message. Safe to retry.
 */
export async function redeemOrderPoints(order: Order): Promise<void> {
  const memberId = order.loyalty?.memberId;
  const points = order.loyalty?.pointsToRedeem ?? 0;
  if (!memberId) throw new Error("This order isn't linked to a rewards member.");
  const steps = points / POINTS_PER_REDEEM_STEP;
  if (!Number.isInteger(steps) || steps < 1) {
    throw new Error(`This order has an invalid rewards amount (${points} points).`);
  }

  let result: { pointsRedeemed: number; discount: number };
  try {
    const response = await httpsCallable<
      { uid: string; orderId: string; steps: number },
      { pointsRedeemed: number; discount: number; balance: number }
    >(rewardsFunctions, "redeemPoints")({ uid: memberId, orderId: order.id, steps });
    result = response.data;
  } catch (err) {
    if (err instanceof FirebaseError && err.code === "functions/failed-precondition") {
      throw new NotEnoughPointsError(err.message || "The member doesn't have enough points.");
    }
    throw new Error(rewardsErrorMessage(err));
  }

  await updateDoc(bizDoc("orders", order.id), {
    "loyalty.pointsRedeemed": result.pointsRedeemed,
    "loyalty.redeemedAmount": result.discount,
    "loyalty.redeemedAt": serverTimestamp(),
  });
}

/**
 * Everything rewards needs on Complete, in order: take the used points, then collect the
 * earned points. Each step is skipped if already done, so it's safe to retry.
 */
export async function settleOrderRewards(order: Order): Promise<void> {
  if (needsPointsRedeemed(order)) await redeemOrderPoints(order);
  if (needsPointsCollected(order)) await collectOrderPoints(order);
}

/**
 * Not enough points at pickup, order not paid yet: drop the rewards discount so the
 * customer pays full price. Returns the order as it is now, to collect points on.
 */
export async function removeRewardsDiscount(order: Order): Promise<Order> {
  const taxBreakDown = calculateTaxBreakdown(order.taxBreakDown.subTotal);
  await updateDoc(bizDoc("orders", order.id), {
    taxBreakDown,
    "loyalty.pointsToRedeem": deleteField(),
  });
  return {
    ...order,
    taxBreakDown,
    loyalty: order.loyalty ? { ...order.loyalty, pointsToRedeem: undefined } : undefined,
  };
}

/**
 * Not enough points, but the customer already paid the discounted price (order completed
 * earlier): stop trying to take the points, so the earned points can still be collected.
 */
export async function waiveRedeem(order: Order): Promise<Order> {
  await updateDoc(bizDoc("orders", order.id), { "loyalty.redeemWaived": true });
  return {
    ...order,
    loyalty: order.loyalty ? { ...order.loyalty, redeemWaived: true } : undefined,
  };
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

  let result: CollectPointsResult;
  try {
    const response = await httpsCallable<
      { uid: string; orderId: string; subtotal: number },
      { pointsEarned: number; bonusPoints?: number; balance: number }
    >(rewardsFunctions, "earnPoints")({
      uid: memberId,
      orderId: order.id,
      subtotal: earnableSubtotal(order),
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
  await updateDoc(bizDoc("orders", order.id), {
    "loyalty.pointsEarned": result.pointsEarned + result.bonusPoints,
    "loyalty.collectedAt": serverTimestamp(),
  });
  return result;
}

/**
 * Cancelling an order whose points were already taken or collected: undoes both for the
 * member (rewards `reverseOrder` gives used points back and removes earned ones — once per
 * order, safe to retry), then records it on the order.
 * Throws a staff-facing message on failure.
 */
export async function reverseOrderPoints(order: Order): Promise<number> {
  const memberId = order.loyalty?.memberId;
  if (!memberId) throw new Error("This order isn't linked to a rewards member.");

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

  await updateDoc(bizDoc("orders", order.id), {
    "loyalty.reversedAt": serverTimestamp(),
    "loyalty.pointsReversed": pointsChanged,
    "loyalty.reversePending": false,
  });
  return pointsChanged;
}

/** Staff cancelled anyway after removing the points failed — flag it for a retry. */
export async function markReversePending(order: Order): Promise<void> {
  await updateDoc(bizDoc("orders", order.id), { "loyalty.reversePending": true });
}
