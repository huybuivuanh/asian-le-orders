// Saskatchewan restaurant meal tax rates. Mirrors asian-le-website's
// lib/orderPricing.ts (calculateTaxBreakdown) so a locally recalculated
// OrderTaxBreakDown matches what the website would have produced.
export const GST_RATE = 0.05;
export const PST_RATE = 0.06;

function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateTaxBreakdown(subTotal: number): OrderTaxBreakDown {
  const roundedSubTotal = roundToCents(subTotal);
  const pst = roundToCents(roundedSubTotal * PST_RATE);
  const gst = roundToCents(roundedSubTotal * GST_RATE);
  const total = roundToCents(roundedSubTotal + pst + gst);
  return { subTotal: roundedSubTotal, pst, gst, total };
}
