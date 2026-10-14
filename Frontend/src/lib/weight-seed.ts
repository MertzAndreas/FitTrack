import { newId, sortEntries, type WeightEntry } from '@/lib/weight'
import type { Phase } from '@/lib/weight-goals'

/**
 * Mock data for the weight page, in one place so it is easy to delete once the
 * backend exists. Nothing here is derived — every value is a plausible reading.
 */

/** [date, weight, waist, chest, arm] — hips and thigh are left out on purpose
 * so partial entries show up in the list and chart. */
const rows: [string, number, number, number, number][] = [
  ['2026-05-15', 85.0, 96.5, 108, 33.8],
  ['2026-05-19', 84.7, 96.2, 108, 33.9],
  ['2026-05-22', 84.8, 96, 107.5, 33.9],
  ['2026-05-26', 84.3, 95.8, 107.5, 34.0],
  ['2026-05-29', 84.4, 95.5, 107.5, 34.0],
  ['2026-06-02', 84.0, 95.2, 107, 34.1],
  ['2026-06-05', 84.1, 95, 107, 34.1],
  ['2026-06-09', 83.7, 94.8, 107, 34.2],
  ['2026-06-12', 83.8, 94.5, 106.5, 34.2],
  ['2026-06-16', 83.4, 94.2, 106.5, 34.3],
  ['2026-06-19', 83.5, 94, 106.5, 34.3],
  ['2026-06-23', 83.1, 93.8, 106, 34.4],
  ['2026-06-26', 83.2, 93.5, 106, 34.4],
  ['2026-06-30', 82.8, 93.2, 105.5, 34.5],
  ['2026-07-03', 82.9, 93, 105.5, 34.5],
  ['2026-07-07', 82.5, 92.8, 105.5, 34.6],
  ['2026-07-10', 82.6, 92.5, 105, 34.6],
  ['2026-07-14', 82.2, 92.2, 105, 34.7],
  ['2026-07-17', 82.3, 92, 105, 34.7],
  ['2026-07-21', 81.9, 91.8, 104.5, 34.8],
  ['2026-07-24', 82.0, 91.5, 104.5, 34.8],
  ['2026-07-28', 81.6, 91.2, 104.5, 34.9],
  ['2026-07-31', 81.7, 91, 104, 34.9],
  ['2026-08-04', 81.3, 90.8, 104, 35.0],
  ['2026-08-07', 81.4, 90.5, 104, 35.0],
  ['2026-08-11', 81.0, 90.2, 103.5, 35.1],
  ['2026-08-14', 81.1, 90, 103.5, 35.1],
  ['2026-08-18', 80.7, 89.8, 103.5, 35.2],
  ['2026-08-21', 80.8, 89.5, 103, 35.2],
  ['2026-08-25', 80.5, 89.5, 103, 35.3],
  ['2026-08-28', 80.6, 89.3, 103, 35.3],
  ['2026-09-01', 80.3, 89.2, 102.5, 35.4],
  ['2026-09-04', 80.4, 89, 102, 35.4],
  ['2026-09-07', 80.4, 88.8, 101.5, 35.4],
  ['2026-09-09', 80.1, 88.5, 101.5, 35.4],
  ['2026-09-11', 80.2, 88.4, 101, 35.5],
  ['2026-09-14', 79.8, 88.2, 101, 35.6],
  ['2026-09-16', 79.9, 88.2, 101, 35.6],
  ['2026-09-18', 79.6, 88, 100.5, 35.7],
  ['2026-09-21', 79.5, 87.8, 100.5, 35.8],
  ['2026-09-23', 79.3, 87.8, 100.5, 35.8],
  ['2026-09-25', 79.4, 87.6, 100, 35.9],
  ['2026-09-28', 79.1, 87.5, 100, 36],
  ['2026-09-30', 79.0, 87.2, 100, 36],
  ['2026-10-02', 78.8, 87.2, 99.5, 36],
  ['2026-10-05', 78.9, 87, 99.5, 36.1],
  ['2026-10-07', 78.7, 86.8, 99.5, 36.1],
  ['2026-10-09', 78.9, 86.8, 99, 36.2],
  ['2026-10-10', 78.7, 86.6, 99, 36.2],
  ['2026-10-11', 78.6, 86.5, 98.5, 36.2],
  ['2026-10-12', 78.5, 86.5, 98.5, 36.3],
  ['2026-10-13', 78.4, 86.5, 98, 36.4],
]

/**
 * About five months of a slow cut (mid-May to mid-October 2026), so the week,
 * month, three-month and all-time ranges all show different data.
 */
export function seedEntries(): WeightEntry[] {
  return sortEntries(
    rows.map(([date, weight, waist, chest, arm]) => ({
      id: newId('weight'),
      date,
      weight,
      measurements: { waist, chest, arm },
      photos: [],
    }))
  )
}

/**
 * A single in-progress cut: from mid-May, targeting 74 kg by the end of the
 * year at ~0.6%/week. Left unfinished on purpose so the on-track verdict has
 * something to say. Append a maintain or bulk with a later `startDate` to
 * extend the story.
 */
export function seedPhases(): Phase[] {
  return [
    {
      id: newId('phase'),
      startDate: '2026-05-15',
      targetWeight: 74,
      // ~0.5 kg/week at 85 kg, decaying as the weight drops.
      ratePercentPerWeek: -0.6,
      targetDate: '2026-12-31',
    },
  ]
}
