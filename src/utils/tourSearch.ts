export function tourSearchQuery(input: URLSearchParams, defaultSize = 5) {
  const bounded = (raw: string | null, fallback: number, min: number, max: number) => {
    const value = raw && /^\d+$/.test(raw) ? Number(raw) : fallback;
    return Number.isSafeInteger(value) && value >= min ? Math.min(value, max) : fallback;
  };
  // tour-service caps pageable size at 50, so the URL must not advertise a larger page.
  const fallback = bounded(String(defaultSize), 5, 1, 50);
  // TourService.searchTours rejects page > 2000; clamping keeps a shared deep link on a real page.
  const page = bounded(input.get('page'), 0, 0, 2_000);
  const size = bounded(input.get('size'), fallback, 1, 50);
  const query = new URLSearchParams();
  for (const key of ['dest', 'depD', 'minP', 'maxP', 'veh', 'dep', 'sort']) {
    const value = input.get(key);
    if (value) query.set(key, value);
  }
  query.set('page', String(page)); query.set('size', String(size));
  return { query, page, size };
}

export interface BudgetBucket {
  key: string;
  label: string;
  /** Lowest whole-VND price still shown in this bucket. */
  floor: number;
  /** Round ceiling the label quotes; null means no upper bound. */
  ceiling: number | null;
}

export const BUDGET_BUCKETS: BudgetBucket[] = [
  { key: 'under5', label: 'Dưới 5 triệu', floor: 0, ceiling: 5_000_000 },
  { key: '5to10', label: 'Từ 5 - 10 triệu', floor: 5_000_000, ceiling: 10_000_000 },
  { key: '10to20', label: 'Từ 10 - 20 triệu', floor: 10_000_000, ceiling: 20_000_000 },
  { key: 'over20', label: 'Trên 20 triệu', floor: 20_000_000, ceiling: null },
];

/**
 * tour-service compares both bounds inclusively, so the sent ceiling is one dong below the round
 * number in the label; a price can then match a single bucket only. Payments are whole VND
 * (VNPay/MoMo use longValueExact), so no payable price falls between a ceiling and the next floor.
 */
export function budgetParams(key: string | null): { minP: string; maxP: string | null } | null {
  const bucket = BUDGET_BUCKETS.find((item) => item.key === key);
  if (!bucket) return null;
  return {
    minP: String(bucket.floor),
    maxP: bucket.ceiling === null ? null : String(bucket.ceiling - 1),
  };
}

/** Reads a bucket back from the URL and still recognises links that quote the round ceiling. */
export function budgetKeyFromParams(minP: string | null, maxP: string | null): string | null {
  if (minP === null && maxP === null) return null;
  const min = minP === null ? Number.NaN : Number(minP);
  const max = maxP === null ? null : Number(maxP);
  return (
    BUDGET_BUCKETS.find(
      (bucket) =>
        bucket.floor === min &&
        (bucket.ceiling === null ? max === null : max === bucket.ceiling || max === bucket.ceiling - 1)
    )?.key ?? null
  );
}
