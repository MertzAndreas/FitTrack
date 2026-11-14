import { useState } from "react";
import { EllipsisVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Block } from "./food";
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

export const FoodLoggingOverview = ({ blocks }: FoodLoggingOverviewProps) => {
  const [activeBlock, setActiveBlock] = useState<Block | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copyDayOpen, setCopyDayOpen] = useState(false);
  const { dateKey } = useSelectedDay();
  const { mutate: deleteEntry } = useDeleteFoodEntry();

  const openFoodSearch = (block: Block) => {
    setActiveBlock(block);
    setDrawerOpen(true);
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
              key={block.name}
              block={block}
              onAddFood={() => openFoodSearch(block)}
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

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} showSwipeHandle>
        <DrawerContent className={"h-screen"}>
          <DrawerHeader>
            <DrawerTitle>Add food</DrawerTitle>
            {activeBlock && (
              <DrawerDescription>{activeBlock.name}</DrawerDescription>
            )}
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 pt-0">
            {activeBlock && (
              <SearchFoods
                key={activeBlock.id}
                blockId={activeBlock.id}
                onSaved={() => setDrawerOpen(false)}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};
