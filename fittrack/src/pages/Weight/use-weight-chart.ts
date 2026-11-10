import * as React from "react";
import {
  format,
  getISOWeek,
  differenceInCalendarDays,
  startOfDay,
  subDays,
} from "date-fns";
import { type DateRange } from "react-day-picker";
import type { WeightEntry } from "./types";

type TickFormatter = (d: Date) => string;

const formatDay: TickFormatter = (d) => format(d, "d MMM");
const formatWeek: TickFormatter = (d) => `W${getISOWeek(d)}`;
const formatMonth: TickFormatter = (d) => format(d, "yy MMM");

type IntervalKey = "30" | "60" | "90" | "all" | "custom";

type IntervalConfig = {
  label: string;
  /** Number of days back from today; null = not a fixed preset */
  days: number | null;
  tickFormatter: TickFormatter;
  /** Show one tick every N data points (data is daily) */
  tickEvery: number;
};

export const INTERVALS: Record<IntervalKey, IntervalConfig> = {
  "30": { label: "30 Days", days: 30, tickFormatter: formatDay, tickEvery: 2 },
  "60": { label: "60 Days", days: 60, tickFormatter: formatWeek, tickEvery: 7 },
  "90": { label: "90 Days", days: 90, tickFormatter: formatWeek, tickEvery: 7 },
  all: { label: "All", days: null, tickFormatter: formatMonth, tickEvery: 30 },
  custom: {
    label: "Custom",
    days: null,
    tickFormatter: formatMonth,
    tickEvery: 30,
  },
};

export const PRESET_KEYS: IntervalKey[] = ["30", "60", "90", "all"];

/** Custom ranges have no fixed config, so pick granularity from their span. */
const resolveConfig = (
  key: IntervalKey,
  range: DateRange | undefined,
): IntervalConfig => {
  if (key !== "custom" || !range?.from) return INTERVALS[key];

  const span = differenceInCalendarDays(range.to ?? range.from, range.from);
  if (span <= 30)
    return { ...INTERVALS.custom, tickFormatter: formatDay, tickEvery: 5 };
  if (span <= 120)
    return { ...INTERVALS.custom, tickFormatter: formatWeek, tickEvery: 7 };
  return INTERVALS.custom;
};

const formatRange = (dates: Date[]) => {
  if (dates.length === 0) return "No data";
  return `${dates[0].toDateString()} - ${dates[dates.length - 1].toDateString()}`;
};

const filterData = (
  key: IntervalKey,
  chartData: WeightEntry[],
  range?: DateRange,
) => {
  if (key === "all") return chartData;

  if (key === "custom") {
    if (!range?.from) return chartData;
    const from = startOfDay(range.from);
    const to = range.to ?? range.from;
    return chartData.filter((d) => d.date >= from && d.date <= to);
  }

  const now = new Date();
  const from = startOfDay(subDays(now, INTERVALS[key].days!));
  return chartData.filter((d) => d.date >= from && d.date <= now);
};

export const UseWeightChart = (chartData: WeightEntry[]) => {
  const [activeKey, setActiveKey] = React.useState<IntervalKey>("30");
  const [customRange, setCustomRange] = React.useState<DateRange | undefined>();

  const config = resolveConfig(activeKey, customRange);
  const range = filterData(activeKey, chartData, customRange);
  const dateRangeLabel = formatRange(range.map((d) => d.date));

  const handleCustomSelect = (range: DateRange | undefined) => {
    setCustomRange(range);
    setActiveKey(range?.from ? "custom" : "30");
  };

  return {
    customRange,
    activeKey,
    setActiveKey,
    handleCustomSelect,
    config,
    range,
    dateRangeLabel,
  };
};
