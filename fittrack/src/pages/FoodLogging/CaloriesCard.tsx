import { Fragment } from "react";
import {
  Label,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  calculateMealsMacros,
  MACRO_COLORS,
  type MacroName,
  type Block,
} from "./food";
import { useSelectedDay } from "./use-selected-day";

const GOAL = 2000;
const SIZE = 280; // px, change this one number to resize everything
const OUTER = SIZE * 0.38;
const INNER = SIZE * 0.3; // ring thickness = OUTER - INNER

const chartConfig = {
  value: { label: "Calories" },
} satisfies ChartConfig;

type MacroGoal = {
  name: MacroName;
  amount: number;
  goal: number;
};

const macros: MacroGoal[] = [
  { name: "Carbs", amount: 40, goal: 140 },
  { name: "Protein", amount: 40, goal: 140 },
  { name: "Fat", amount: 40, goal: 140 },
];

type RingProps = {
  value: number;
  color: string;
  withBackground?: boolean;
  children?: React.ReactNode;
};

// One ring: full circle = GOAL, starts at 12 o'clock, runs clockwise
const Ring = ({ value, color, withBackground, children }: RingProps) => (
  <ChartContainer
    config={chartConfig}
    className="absolute inset-0 h-full w-full aspect-auto!"
  >
    <RadialBarChart
      data={[{ name: "calories", value }]}
      startAngle={90}
      endAngle={-270}
      innerRadius={INNER}
      outerRadius={OUTER}
    >
      <PolarAngleAxis type="number" domain={[0, GOAL]} tick={false} />
      {withBackground && (
        <PolarGrid
          gridType="circle"
          radialLines={false}
          className="fill-accent first:fill-card"
          stroke="none"
          polarRadius={[OUTER, INNER]}
        />
      )}
      <RadialBar dataKey="value" fill={color} background={withBackground} />
      <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
        {children}
      </PolarRadiusAxis>
    </RadialBarChart>
  </ChartContainer>
);

const MacrosOverview = ({ macros }: { macros: MacroGoal[] }) => (
  <div className="flex w-full gap-4 md:gap-6  border bg-muted/50 p-4">
    {macros.map((m, index) => (
      <Fragment key={m.name}>
        {index > 0 && <Separator orientation="vertical" />}
        <Progress
          className="flex-1"
          value={Math.min(m.amount, m.goal)}
          max={m.goal}
          indicatorColor={MACRO_COLORS[m.name]}
        >
          <ProgressLabel className="font-normal text-muted-foreground">
            {m.name}
          </ProgressLabel>
          <ProgressValue className="text-xs">
            {() => `${m.amount} / ${m.goal}g`}
          </ProgressValue>
        </Progress>
      </Fragment>
    ))}
  </div>
);

type CaloriesCardProps = {
  blocks: Block[];
};
export const CaloriesCard = ({ blocks }: CaloriesCardProps) => {
  const { isToday } = useSelectedDay();
  const { kcal: consumed } = calculateMealsMacros(blocks);

  const isOver = consumed > GOAL;
  const base = Math.min(consumed, GOAL);
  const over = Math.min(Math.max(consumed - GOAL, 0), GOAL);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{isToday ? "Today's Calories" : "Calories"}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <div className="relative mx-auto aspect-square max-h-62.5">
          <Ring value={base} color="var(--chart-1)" withBackground>
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className={`text-4xl font-bold ${
                          isOver ? "fill-destructive" : "fill-foreground"
                        }`}
                      >
                        {consumed.toLocaleString()}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 24}
                        className="fill-muted-foreground"
                      >
                        / {GOAL.toLocaleString()} kcal
                      </tspan>
                    </text>
                  );
                }
              }}
            />
          </Ring>

          {isOver && <Ring value={over} color="var(--destructive)" />}
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <MacrosOverview macros={macros} />
      </CardFooter>
    </Card>
  );
};
