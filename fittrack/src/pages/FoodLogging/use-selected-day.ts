import { addDays, format, isValid, parseISO, subDays } from "date-fns";
import { useMemo } from "react";
import { useSearchParams } from "react-router";

export const DAY_KEY_FORMAT = "yyyy-MM-dd";
export const toDayKey = (date: Date) => format(date, DAY_KEY_FORMAT);
export const todayKey = () => toDayKey(new Date());

const normalizeDayKey = (value: string | null) => {
  if (!value) return todayKey();

  const parsed = parseISO(value);
  return isValid(parsed) ? toDayKey(parsed) : todayKey();
};

export const useSelectedDay = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dateKey = normalizeDayKey(searchParams.get("date"));
  const date = useMemo(() => parseISO(dateKey), [dateKey]);
  const isToday = dateKey === todayKey();

  const setDateKey = (nextKey: string) => {
    const normalized = normalizeDayKey(nextKey);

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("date", normalized);
        return next;
      },
      { replace: true },
    );
  };

  const setDate = (next: Date) => setDateKey(toDayKey(next));
  const goToToday = () => setDateKey(todayKey());
  const goToPreviousDay = () => setDateKey(toDayKey(subDays(date, 1)));
  const goToNextDay = () => setDateKey(toDayKey(addDays(date, 1)));

  return {
    date,
    dateKey,
    isToday,
    setDate,
    setDateKey,
    goToToday,
    goToPreviousDay,
    goToNextDay,
  };
};
