// Saskatchewan restaurant meal tax rates. Mirrors asian-le-website's
// lib/orderPricing.ts (calculateTaxBreakdown) so a locally recalculated
// OrderTaxBreakDown matches what the website would have produced.

export const GST_RATE = 0.05;
export const PST_RATE = 0.06;

function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Taxes and total, in the POS's shape. Rewards points come off before tax and never take
 * the order below $0 (`rewards.amount` is what was actually taken off). Online orders never
 * have a staff `discount`.
 */
export function calculateTaxBreakdown(
  subTotal: number,
  rewards?: OrderRewards | null,
): OrderTaxBreakDown {
  const roundedSubTotal = roundToCents(subTotal);
  const rewardsAmount = rewards
    ? roundToCents(Math.min(roundedSubTotal, Math.max(0, rewards.amount)))
    : 0;
  const taxableSubtotal = roundToCents(roundedSubTotal - rewardsAmount);
  const pst = roundToCents(taxableSubtotal * PST_RATE);
  const gst = roundToCents(taxableSubtotal * GST_RATE);
  const total = roundToCents(taxableSubtotal + pst + gst);
  return {
    subTotal: roundedSubTotal,
    ...(rewards && rewardsAmount > 0
      ? { rewards: { points: rewards.points, amount: rewardsAmount } }
      : {}),
    taxableSubtotal,
    pst,
    gst,
    total,
  };
}
