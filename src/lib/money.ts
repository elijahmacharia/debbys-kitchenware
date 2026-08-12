/**
 * Every price in this system is an integer number of cents. Floating point
 * arithmetic on money produces errors like 0.1 + 0.2 = 0.30000000000000004,
 * which becomes a wrong total on a real invoice, so we never store or add
 * fractional currency values.
 */

/** 45000 -> "KSh 450" ; 45050 -> "KSh 450.50" */
export function formatKsh(cents: number): string {
  const shillings = cents / 100;
  const hasCents = cents % 100 !== 0;
  return `KSh ${shillings.toLocaleString('en-KE', {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

/** "450" or "450.50" from a form -> 45000 / 45050. Null if invalid. */
export function parseShillingsToCents(input: string | number): number | null {
  const raw = String(input).trim().replace(/,/g, '').replace(/^KSh\s*/i, '');
  if (raw === '' || !/^\d+(\.\d{1,2})?$/.test(raw)) return null;
  return Math.round(Number(raw) * 100);
}

/** Cents back to a plain decimal string for pre-filling admin inputs. */
export function centsToInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return '';
  return (cents / 100).toFixed(2).replace(/\.00$/, '');
}

/** The price a customer actually pays right now. */
export function effectivePriceCents(p: { priceCents: number; salePriceCents: number | null }): number {
  return p.salePriceCents !== null && p.salePriceCents < p.priceCents ? p.salePriceCents : p.priceCents;
}

export function isOnSale(p: { priceCents: number; salePriceCents: number | null }): boolean {
  return p.salePriceCents !== null && p.salePriceCents < p.priceCents;
}

/** Whole-number percentage off, e.g. 25 for "25% OFF". Zero when not on sale. */
export function discountPercent(p: { priceCents: number; salePriceCents: number | null }): number {
  if (!isOnSale(p) || p.priceCents === 0) return 0;
  return Math.round(((p.priceCents - p.salePriceCents!) / p.priceCents) * 100);
}
