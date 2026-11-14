import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSelectedDay } from "./use-selected-day";

export const DayNavigator = () => {
  const {
    date,
    isToday,
    setDate,
    goToToday,
    goToPreviousDay,
    goToNextDay,
  } = useSelectedDay();
  const [calendarOpen, setCalendarOpen] = useState(false);

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous day"
          onClick={goToPreviousDay}
        >
          <ChevronLeft className="size-4" />
        </Button>

        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                className="min-w-0 flex-1 justify-center gap-2 sm:min-w-52 sm:flex-none"
              />
            }
          >
            <CalendarIcon className="size-4" />
            <span className="truncate">
              <span className="sm:hidden">{format(date, "MMM d")}</span>
              <span className="hidden sm:inline">
                {format(date, "EEE, MMM d, yyyy")}
              </span>
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              defaultMonth={date}
              onSelect={(next) => {
                if (!next) return;
                setDate(next);
                setCalendarOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="icon"
          aria-label="Next day"
          onClick={goToNextDay}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={goToToday}
        disabled={isToday}
      >
        Today
      </Button>
    </div>
  );
};
