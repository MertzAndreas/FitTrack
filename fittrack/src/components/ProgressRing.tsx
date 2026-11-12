import {
  Label,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";

import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

const chartConfig = {
  progress: { label: "Progress" },
} satisfies ChartConfig;

type ProgressRingProps = {
  percent: number;
  label: string;
  sublabel?: string;
  color: string;
  size?: "default" | "compact";
  ariaLabel?: string;
};

export const ProgressRing = ({
  percent,
  label,
  sublabel,
  color,
  size = "default",
  ariaLabel,
}: ProgressRingProps) => {
  const compact = size === "compact";
  const outerRadius = compact ? 38 : 90;
  const innerRadius = compact ? 30 : 75;

  return (
    <ChartContainer
      config={chartConfig}
      role="img"
      aria-label={ariaLabel ?? (sublabel ? `${label} ${sublabel}` : label)}
      className={
        compact
          ? "mx-auto aspect-square w-20 shrink-0"
          : "mx-auto aspect-square w-full max-h-[225px]"
      }
    >
      <RadialBarChart
        data={[{ value: percent, fill: color }]}
        startAngle={90}
        endAngle={-270}
        outerRadius={outerRadius}
        innerRadius={innerRadius}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <PolarGrid
          gridType="circle"
          radialLines={false}
          stroke="none"
          className="first:fill-muted last:fill-background"
          polarRadius={[outerRadius, innerRadius]}
        />
        <RadialBar dataKey="value" background cornerRadius={compact ? 6 : 10} />
        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
          <Label
            content={({ viewBox }) => {
              if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) {
                return null;
              }
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
                    className={
                      compact
                        ? "fill-foreground text-lg font-bold"
                        : "fill-foreground text-3xl font-bold"
                    }
                  >
                    {label}
                  </tspan>
                  {sublabel ? (
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + (compact ? 13 : 24)}
                      className={
                        compact
                          ? "fill-muted-foreground text-[9px]"
                          : "fill-muted-foreground"
                      }
                    >
                      {sublabel}
                    </tspan>
                  ) : null}
                </text>
              );
            }}
          />
        </PolarRadiusAxis>
      </RadialBarChart>
    </ChartContainer>
  );
};
