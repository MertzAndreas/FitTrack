import type { ReactNode } from "react";
import { format } from "date-fns";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { WeightEntry } from "../types";
import { ChangeDirectionIcon, WeightWithUnit } from "./weight-display";
import { computeWeeklyRateKg, WEEKLY_RATE_WINDOW_DAYS } from "./stats";

const TrendItem = ({
  label,
  icon,
  value,
  caption,
}: {
  label: string;
  icon: ReactNode;
  value: ReactNode;
  caption: string;
}) => (
  <div className="flex flex-col items-center text-center">
    <span className="mb-1">{icon}</span>
    <span className="text-xs font-medium text-muted-foreground">{label}</span>
    {value}
    <p className="mt-0.5 text-xs text-muted-foreground">{caption}</p>
  </div>
);

export const TrendsCard = ({ entries }: { entries: WeightEntry[] }) => {
  const weeklyRateKg = computeWeeklyRateKg(entries);
  const { lowest, highest } = entries.reduce(
    (extremes, entry) => ({
      lowest:
        entry.weightKg < extremes.lowest.weightKg ? entry : extremes.lowest,
      highest:
        entry.weightKg > extremes.highest.weightKg ? entry : extremes.highest,
    }),
    { lowest: entries[0], highest: entries[0] },
  );

  return (
    <Card className="md:col-span-2 lg:col-span-3">
      <CardHeader>
        <CardTitle>Weight trends</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 items-start gap-6 sm:grid-cols-3 sm:gap-4">
        <TrendItem
          label="Weekly rate"
          icon={
            weeklyRateKg !== null ? (
              <ChangeDirectionIcon changeKg={weeklyRateKg} />
            ) : (
              <Minus className="size-6 text-muted-foreground" />
            )
          }
          value={
            weeklyRateKg !== null ? (
              <WeightWithUnit kg={weeklyRateKg} unit="kg / week" signed />
            ) : (
              <p className="text-2xl font-bold tracking-tight">–</p>
            )
          }
          caption={
            weeklyRateKg !== null
              ? `Last ${WEEKLY_RATE_WINDOW_DAYS} days`
              : "Not enough recent entries"
          }
        />
        <TrendItem
          label="Lowest"
          icon={<TrendingDown className="size-6 text-vivid-3" />}
          value={<WeightWithUnit kg={lowest.weightKg} />}
          caption={format(lowest.date, "MMM d, y")}
        />
        <TrendItem
          label="Highest"
          icon={<TrendingUp className="size-6 text-vivid-4" />}
          value={<WeightWithUnit kg={highest.weightKg} />}
          caption={format(highest.date, "MMM d, y")}
        />
      </CardContent>
    </Card>
  );
};
