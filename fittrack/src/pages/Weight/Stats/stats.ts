import { startOfDay, subDays } from "date-fns";

import type { WeightEntry } from "../types";

export const MS_PER_DAY = 86_400_000;

export const WEEKLY_RATE_WINDOW_DAYS = 30;
const WEEKLY_RATE_MIN_ENTRIES = 3;
const WEEKLY_RATE_MIN_SPAN_DAYS = 7;

/** Least-squares slope over the recent window, expressed in kg per week. */
export function computeWeeklyRateKg(
  entriesByDate: WeightEntry[],
  windowDays = WEEKLY_RATE_WINDOW_DAYS,
): number | null {
  if (entriesByDate.length === 0) return null;

  const latest = entriesByDate[entriesByDate.length - 1];
  const cutoff = subDays(startOfDay(latest.date), windowDays).getTime();
  const windowEntries = entriesByDate.filter(
    (entry) => entry.date.getTime() >= cutoff,
  );

  if (windowEntries.length < WEEKLY_RATE_MIN_ENTRIES) return null;

  const t0 = windowEntries[0].date.getTime();
  const xs = windowEntries.map(
    (entry) => (entry.date.getTime() - t0) / MS_PER_DAY,
  );
  const ys = windowEntries.map((entry) => entry.weightKg);

  if (xs[xs.length - 1] < WEEKLY_RATE_MIN_SPAN_DAYS) return null;

  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  const numerator = xs.reduce(
    (sum, x, i) => sum + (x - meanX) * (ys[i] - meanY),
    0,
  );
  const denominator = xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0);

  return denominator === 0
    ? null
    : Number(((numerator / denominator) * 7).toFixed(2));
}
