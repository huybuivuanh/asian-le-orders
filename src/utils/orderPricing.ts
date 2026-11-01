// Saskatchewan restaurant meal tax rates. Mirrors asian-le-website's
// lib/orderPricing.ts (calculateTaxBreakdown) so a locally recalculated
// OrderTaxBreakDown matches what the website would have produced.
import { DiscountType } from "@/types/enum";

export const GST_RATE = 0.05;
export const PST_RATE = 0.06;

function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Taxes and total, with an optional dollar discount taken off before tax (never below $0). */
export function calculateTaxBreakdown(subTotal: number, discountDollars = 0): OrderTaxBreakDown {
  const roundedSubTotal = roundToCents(subTotal);
  const discountAmount = roundToCents(Math.min(roundedSubTotal, Math.max(0, discountDollars)));
  const taxableSubtotal = roundToCents(roundedSubTotal - discountAmount);
  const pst = roundToCents(taxableSubtotal * PST_RATE);
  const gst = roundToCents(taxableSubtotal * GST_RATE);
  const total = roundToCents(taxableSubtotal + pst + gst);
  const base = { subTotal: roundedSubTotal, pst, gst, total };
  if (discountAmount <= 0) return base;
  return {
    ...base,
    discount: {
      discountType: DiscountType.Amount,
      discountValue: discountAmount,
      discountAmount,
      taxableSubtotal,
    },
  };
}
