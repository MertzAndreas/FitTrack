import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { WeightEntry } from "../types";

const BMI_SCALE_MIN = 15;
const BMI_SCALE_MAX = 43.5;

const BMI_CATEGORIES = [
  {
    label: "Underweight",
    from: BMI_SCALE_MIN,
    to: 18.5,
    barClass: "bg-sky-500/70",
    textClass: "text-sky-500",
  },
  {
    label: "Normal",
    from: 18.5,
    to: 25,
    barClass: "bg-emerald-500/70",
    textClass: "text-emerald-500",
  },
  {
    label: "Overweight",
    from: 25,
    to: 30,
    barClass: "bg-amber-500/70",
    textClass: "text-amber-500",
  },
  {
    label: "Moderate Obesity",
    from: 30,
    to: 35,
    barClass: "bg-rose-400/70",
    textClass: "text-rose-300",
  },
  {
    label: "Severe Obesity",
    from: 35,
    to: 40,
    barClass: "bg-rose-500/70",
    textClass: "text-rose-300",
  },
  {
    label: "Morbid Obesity",
    from: 40,
    to: BMI_SCALE_MAX,
    barClass: "bg-rose-600/70",
    textClass: "text-rose-700",
  },
] as const;

const bmiScalePercent = (bmi: number) =>
  ((Math.min(BMI_SCALE_MAX, Math.max(BMI_SCALE_MIN, bmi)) - BMI_SCALE_MIN) /
    (BMI_SCALE_MAX - BMI_SCALE_MIN)) *
  100;

function computeBmi(weightKg: number, heightCm: number) {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const category =
    BMI_CATEGORIES.find((c) => bmi < c.to) ??
    BMI_CATEGORIES[BMI_CATEGORIES.length - 1];

  return { value: Number(bmi.toFixed(2)), category };
}

const BmiMarker = ({
  percent,
  variant,
}: {
  percent: number;
  variant: "current" | "goal";
}) => (
  <div
    className={`absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${
      variant === "current"
        ? "border-background bg-foreground shadow"
        : "border-foreground bg-background"
    }`}
    style={{ left: `${percent}%` }}
  />
);

export const BmiCard = ({
  entries,
  goalKg,
  heightCm,
}: {
  entries: WeightEntry[];
  goalKg: number;
  heightCm: number;
}) => {
  const latest = entries[entries.length - 1];
  const bmi = computeBmi(latest.weightKg, heightCm);
  const goalBmi = computeBmi(goalKg, heightCm);

  return (
    <Card className="h-full flex flex-col md:col-span-2">
      <CardHeader>
        <CardTitle>Body Mass Index - BMI</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-evenly ">
        <div className="text-center">
          <p className="text-5xl font-bold tracking-tight">{bmi.value}</p>
          <p className={`mt-1 text-sm font-medium ${bmi.category.textClass}`}>
            {bmi.category.label}
          </p>
        </div>
        <div>
          <div className="relative py-4">
            <div className="flex h-2.5 w-full overflow-hidden rounded-full">
              {BMI_CATEGORIES.map((c) => (
                <div
                  key={c.label}
                  className={`h-full ${c.barClass}`}
                  style={{
                    width: `${((c.to - c.from) / (BMI_SCALE_MAX - BMI_SCALE_MIN)) * 100}%`,
                  }}
                />
              ))}
            </div>
            <BmiMarker
              percent={bmiScalePercent(goalBmi.value)}
              variant="goal"
            />
            <BmiMarker percent={bmiScalePercent(bmi.value)} variant="current" />
          </div>
          <div className="relative h-4 text-[10px] text-muted-foreground/70">
            {BMI_CATEGORIES.slice(1).map((c) => (
              <span
                key={c.label}
                className="absolute -translate-x-1/2"
                style={{ left: `${bmiScalePercent(c.from)}%` }}
              >
                {c.from}
              </span>
            ))}
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          <p>
            At {goalKg} kg your BMI would be{" "}
            <span className="font-semibold text-foreground">
              {goalBmi.value}
            </span>{" "}
            (
            <span className={goalBmi.category.textClass}>
              {goalBmi.category.label}
            </span>
            )
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground/70">
            Based on {heightCm} cm
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
