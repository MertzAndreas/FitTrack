import { useState } from "react";
import { parseISO } from "date-fns";

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
import { Skeleton } from "@/components/ui/skeleton";
import type { Block } from "./food";
import { useCopyBlock, useDayBlocks } from "./use-food-logging";
import { toDayKey, useSelectedDay } from "./use-selected-day";

type CopyBlockDrawerProps = {
  sourceBlock: Block;
  onOpenChange: (open: boolean) => void;
};

export const CopyBlockDrawer = ({
  sourceBlock,
  onOpenChange,
}: CopyBlockDrawerProps) => {
  const { dateKey: sourceDate } = useSelectedDay();
  const [destinationDate, setDestinationDate] = useState(() =>
    parseISO(sourceDate),
  );
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
  const destinationKey = toDayKey(destinationDate);
  const { data: destinationBlocks } = useDayBlocks(destinationKey);
  const { mutate, isPending } = useCopyBlock();

  const candidates =
    destinationBlocks?.filter((block) => block.id !== sourceBlock.id) ?? [];
  const destinationBlockId = selectedBlockId ?? candidates[0]?.id ?? null;

  const handleCopy = () => {
    if (destinationBlockId == null) return;
    mutate(
      { sourceId: sourceBlock.id, destinationId: destinationBlockId },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Drawer open onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            Copy {sourceBlock.name} - {sourceDate}
          </DrawerTitle>
        </DrawerHeader>

        <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-4 overflow-auto p-4">
          <Calendar
            mode="single"
            numberOfMonths={2}
            selected={destinationDate}
            onSelect={(next) => {
              if (!next) return;
              setDestinationDate(next);
              setSelectedBlockId(null);
            }}
            className="mx-auto"
            classNames={{ months: "relative flex flex-row gap-4" }}
          />

          <div className="mx-auto flex w-full max-w-sm flex-col gap-2">
            <span className="text-sm font-medium">Meal</span>
            <div className="grid min-h-[5.5rem] grid-cols-2 gap-2">
              {destinationBlocks
                ? candidates.map((block) => (
                    <Button
                      key={block.id}
                      variant={
                        block.id === destinationBlockId
                          ? "default"
                          : "outline"
                      }
                      onClick={() => setSelectedBlockId(block.id)}
                    >
                      {block.name}
                    </Button>
                  ))
                : Array.from({ length: 4 }, (_, index) => (
                    <Skeleton key={index} className="h-10" />
                  ))}
            </div>
          </div>
        </div>

        <DrawerFooter>
          <DrawerClose render={<Button variant="outline" />}>
            Cancel
          </DrawerClose>
          <Button
            onClick={handleCopy}
            disabled={isPending || !destinationBlockId}
          >
            {isPending ? "Copying…" : "Copy"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
