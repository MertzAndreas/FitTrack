import { useState } from "react";
import { addDays, format, formatDate, parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useCopyDay } from "./use-food-logging";
import { toDayKey } from "./use-selected-day";

type CopyDayDrawerProps = {
  sourceDate: string;
  onOpenChange: (open: boolean) => void;
};

export const CopyDayDrawer = ({
  sourceDate,
  onOpenChange,
}: CopyDayDrawerProps) => {
  const [destinationDate, setDestinationDate] = useState(() =>
    addDays(parseISO(sourceDate), 1),
  );
  const { mutate, isPending } = useCopyDay();

  const destinationKey = toDayKey(destinationDate);
  const isSameDay = destinationKey === sourceDate;

  const handleCopy = () => {
    mutate(
      { sourceDate, destinationDate: destinationKey },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Drawer open onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            Copy entries from {formatDate(parseISO(sourceDate), "yyyy-MM-dd")}
          </DrawerTitle>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-auto p-4">
          <Calendar
            mode="single"
            numberOfMonths={2}
            selected={destinationDate}
            disabled={(date) => toDayKey(date) === sourceDate}
            onSelect={(next) => next && setDestinationDate(next)}
            className="mx-auto"
            classNames={{ months: "relative flex flex-row gap-4" }}
          />
        </div>

        <DrawerFooter>
          <DrawerClose render={<Button variant="outline" />}>
            Cancel
          </DrawerClose>
          <Button onClick={handleCopy} disabled={isPending || isSameDay}>
            {isPending
              ? "Copying…"
              : `Copy to ${format(destinationDate, "d MMM")}`}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
