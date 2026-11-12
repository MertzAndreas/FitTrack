import { addDays, format, startOfDay } from "date-fns";

import { ProgressRing } from "@/components/ProgressRing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { WeightEntry } from "../types";
import { computeWeeklyRateKg } from "./stats";

function computeGoalProgress(
  latest: WeightEntry,
  goalKg: number,
  startKg: number,
  weeklyRateKg: number | null,
) {
  const totalToChangeKg = goalKg - startKg;
  if (totalToChangeKg === 0) return null;

  const rawProgress = (latest.weightKg - startKg) / totalToChangeKg;
  const reached = rawProgress >= 1;
  const percent = Math.max(0, Math.min(100, Math.round(rawProgress * 100)));
  const remainingKg = reached
    ? 0
    : Number(Math.abs(latest.weightKg - goalKg).toFixed(1));

  // Only project a date if the current trend actually points toward the goal.
  let projectedDate: Date | null = null;
  if (!reached && weeklyRateKg !== null && weeklyRateKg !== 0) {
    const neededKg = goalKg - latest.weightKg;
    if (Math.sign(weeklyRateKg) === Math.sign(neededKg)) {
      const weeksToGoal = Math.abs(neededKg / weeklyRateKg);
      projectedDate = addDays(
        startOfDay(latest.date),
        Math.ceil(weeksToGoal * 7),
      );
    }
  }

  return {
    goalKg,
    startKg,
    currentKg: latest.weightKg,
    remainingKg,
    percent,
    reached,
    projectedDate,
  };
}

const GoalStat = ({ label, kg }: { label: string; kg: number }) => (
  <div className="flex flex-col items-center">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-sm font-semibold">{kg} kg</span>
  </div>
);

export const GoalProgressCard = ({
  entries,
  goalKg,
  startKg,
}: {
  entries: WeightEntry[];
  goalKg: number;
  startKg?: number;
}) => {
  const latest = entries[entries.length - 1];
  const progress = computeGoalProgress(
    latest,
    goalKg,
    startKg ?? entries[0].weightKg,
    computeWeeklyRateKg(entries),
  );

  if (!progress) return null;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Goal progress</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between gap-2">
        <ProgressRing
          percent={progress.percent}
          label={`${progress.percent}%`}
          sublabel={
            progress.reached
              ? "Goal reached"
              : `${progress.remainingKg} kg to go`
          }
          color="var(--primary)"
        />
        <div className="grid grid-cols-3 border-t pt-2">
          <GoalStat label="Start" kg={progress.startKg} />
          <GoalStat label="Now" kg={progress.currentKg} />
          <GoalStat label="Goal" kg={progress.goalKg} />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          {progress.reached
            ? "You've hit your goal weight"
            : progress.projectedDate
              ? `On track for ${format(progress.projectedDate, "MMM d, y")}`
              : "Not currently trending toward goal"}
        </p>
      </CardContent>
    </Card>
  );
};
