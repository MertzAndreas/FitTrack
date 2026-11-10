import { type DateRange } from "react-day-picker";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { CalendarIcon } from "lucide-react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { INTERVALS, PRESET_KEYS, UseWeightChart } from "./use-weight-chart";
import { format } from "date-fns";
import type { WeightEntry } from "./types";

const chartConfig = {
  weightKg: { label: "Weight (kg)", color: "var(--chart-1)" },
} satisfies ChartConfig;

export const WeightChart = ({ data }: { data: WeightEntry[] }) => {
  const res = UseWeightChart(data);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weight over time</CardTitle>
        <CardDescription>{res.dateRangeLabel}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            margin={{ left: 0, right: 0, bottom: 5 }}
            accessibilityLayer
            data={res.range}
          >
            <CartesianGrid vertical={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              type="number"
              tickMargin={8}
              domain={["dataMin - 0.5", "dataMax + 0.5"]}
              tickFormatter={(x: number) => Math.round(x).toString()}
            />
            <XAxis
              dataKey="date"
              angle={-45}
              interval={res.config.tickEvery - 1}
              tickFormatter={res.config.tickFormatter}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const date = payload?.[0]?.payload?.date as
                      | Date
                      | undefined;
                    return date ? format(date, "EEE d MMM yyyy") : "";
                  }}
                />
              }
            />
            <Line
              dataKey="weightKg"
              type="natural"
              stroke="var(--color-weightKg)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>

        <CardAction className="mt-8 flex flex-wrap gap-3 items-center">
          {PRESET_KEYS.map((key) => (
            <Button
              key={key}
              variant={res.activeKey === key ? "default" : "outline"}
              onClick={() => res.setActiveKey(key)}
            >
              {INTERVALS[key].label}
            </Button>
          ))}
          <CalendarRange
            value={res.customRange}
            onChange={res.handleCustomSelect}
            active={res.activeKey === "custom"}
          />
        </CardAction>
      </CardContent>
    </Card>
  );
};

type CalendarRangeProps = {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  active?: boolean;
};

export function CalendarRange({ value, onChange, active }: CalendarRangeProps) {
  return (
    <Popover>
      <PopoverTrigger>
        <Button variant={active ? "default" : "outline"}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {INTERVALS.custom.label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="range"
          defaultMonth={value?.from}
          selected={value}
          onSelect={onChange}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}
