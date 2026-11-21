import { useRef, useState } from "react";
import { EllipsisVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Block, type FoodItem } from "./food";
import { CopyDayDrawer } from "./CopyDayDrawer";
import { MealBlock } from "./MealBlock";
import SearchFoods from "./SearchFoods";
import { useDeleteFoodEntry } from "./use-food-logging";
import { useSelectedDay } from "./use-selected-day";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

type FoodLoggingOverviewProps = {
  blocks: Block[];
};

type DrawerState = {
  blockId: number;
  editEntryId: number | null;
};

export const FoodLoggingOverview = ({ blocks }: FoodLoggingOverviewProps) => {
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [copyDayOpen, setCopyDayOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { dateKey } = useSelectedDay();
  const { mutate: deleteEntry } = useDeleteFoodEntry();

  const activeBlock = drawer
    ? (blocks.find((block) => block.id === drawer.blockId) ?? null)
    : null;
  const editingEntry =
    drawer && drawer.editEntryId != null
      ? (activeBlock?.entries.find(
          (entry) => entry.id === drawer.editEntryId,
        ) ?? null)
      : null;

  const openFoodSearch = (block: Block) => {
    setDrawer({ blockId: block.id, editEntryId: null });
  };

  const openEntryEditor = (block: Block, entry: FoodItem) => {
    setDrawer({ blockId: block.id, editEntryId: entry.id });
  };

  const closeDrawer = () => {
    setDrawer(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Food logging</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Food logging options"
                />
              }
            >
              <EllipsisVertical className="size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setCopyDayOpen(true)}>
                Copy day to…
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="flex flex-col gap-8">
          {blocks.map((block) => (
            <MealBlock
              key={block.id}
              block={block}
              onAddFood={() => openFoodSearch(block)}
              onEditEntry={(entry) => openEntryEditor(block, entry)}
              onDeleteEntry={(entry) =>
                deleteEntry({ entryId: entry.id, dateKey })
              }
            />
          ))}
        </CardContent>
      </Card>

      {copyDayOpen && (
        <CopyDayDrawer sourceDate={dateKey} onOpenChange={setCopyDayOpen} />
      )}

      <Drawer
        open={drawer != null}
        onOpenChange={(open) => {
          if (!open) closeDrawer();
        }}
        onOpenChangeComplete={(open) => {
          if (open && editingEntry == null) inputRef.current?.focus();
        }}
        showSwipeHandle
      >
        <DrawerContent className={"h-screen"}>
          <DrawerHeader>
            <DrawerTitle>
              {editingEntry ? "Edit entry" : "Add food"}
            </DrawerTitle>
            {activeBlock && (
              <DrawerDescription>{activeBlock.name}</DrawerDescription>
            )}
          </DrawerHeader>
          <div className="mx-auto min-h-0 w-full max-w-6xl flex-1 overflow-y-auto ">
            {activeBlock && (
              <SearchFoods
                key={`${activeBlock.id}-${editingEntry?.id ?? "new"}`}
                blockId={activeBlock.id}
                editEntry={editingEntry ?? undefined}
                inputRef={inputRef}
                onClose={closeDrawer}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};
