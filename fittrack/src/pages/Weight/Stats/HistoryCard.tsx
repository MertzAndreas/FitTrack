import { format, startOfDay, subDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WeightEntry } from "../types";
import { WeightWithUnit } from "./weight-display";
import { MS_PER_DAY } from "./stats.ts";
const PAST_WEIGHT_CHECKPOINT_DAYS = [30, 60, 90, 120, 180, 365];

const pastWeightToleranceMs = (days: number) =>
  Math.max(3, days * 0.25) * MS_PER_DAY;

const formatSigned = (value: number) => (value > 0 ? `+${value}` : `${value}`);

const formatChangeSince = (changeKg: number) =>
  changeKg === 0 ? "same as now" : `${formatSigned(changeKg)} kg since`;

function findEntryClosestToTime(
  entriesByDate: WeightEntry[],
  targetTimeMs: number,
  maxDistanceMs: number,
  entryToSkip: WeightEntry,
): WeightEntry | null {
  let closest: WeightEntry | null = null;
  let closestDistance = Infinity;

  for (const entry of entriesByDate) {
    if (entry === entryToSkip) continue;
    const distance = Math.abs(entry.date.getTime() - targetTimeMs);
    if (distance < closestDistance) {
      closestDistance = distance;
      closest = entry;
    }
  }

  return closest && closestDistance <= maxDistanceMs ? closest : null;
}

function findPastWeightCheckpoints(entriesByDate: WeightEntry[]) {
  const latestEntry = entriesByDate[entriesByDate.length - 1];
  const today = startOfDay(new Date());

  return PAST_WEIGHT_CHECKPOINT_DAYS.map((daysAgo) => {
    const entry = findEntryClosestToTime(
      entriesByDate,
      subDays(today, daysAgo).getTime(),
      pastWeightToleranceMs(daysAgo),
      latestEntry,
    );
    const changeSinceKg = entry
      ? Number((latestEntry.weightKg - entry.weightKg).toFixed(1))
      : null;

    return { daysAgo, entry, changeSinceKg };
  });
}

export const HistoryCard = ({ entries }: { entries: WeightEntry[] }) => {
  const checkpoints = findPastWeightCheckpoints(entries);

  return (
    <Card className="md:col-span-2 lg:col-span-3">
      <CardHeader>
        <CardTitle>Weight history</CardTitle>
      </CardHeader>
      <CardContent className="grid auto-rows-fr grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {checkpoints.map((c) => (
          <div
            key={c.daysAgo}
            className="flex flex-col justify-center items-center text-center"
          >
            <span className="text-xs font-medium text-muted-foreground">
              {c.daysAgo} days ago
            </span>
            {c.entry ? (
              <>
                <WeightWithUnit kg={c.entry.weightKg} />
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(c.entry.date, "MMM d, y")}
                </p>
                {c.changeSinceKg !== null && (
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                    {formatChangeSince(c.changeSinceKg)}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground/60 mt-2">
                No entry nearby
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
