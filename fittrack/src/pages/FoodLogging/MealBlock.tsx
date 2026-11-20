import { useState } from "react";
import { EllipsisVertical, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  calculateMealMacros,
  IconMap,
  type Block,
  type FoodItem,
} from "./food";
import { CopyBlockDrawer } from "./CopyBlockDrawer";
import { FoodEntryRow } from "./FoodEntryRow";
import { MacroBar, MacroView } from "./MacroView";

type MealBlockProps = {
  block: Block;
  onAddFood?: () => void;
  onDeleteEntry?: (entry: FoodItem) => void;
};

export const MealBlock = ({
  block,
  onAddFood,
  onDeleteEntry,
}: MealBlockProps) => {
  const { name, entries: items, iconKey } = block;
  const Icon = IconMap[iconKey];
  const macros = calculateMealMacros(block);
  const [copyOpen, setCopyOpen] = useState(false);

  return (
    <section aria-label={name} className="flex flex-col gap-3">
      <header className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center bg-accent">
          <Icon className="size-5" aria-hidden />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="text-base font-semibold leading-tight">{name}</h3>
          <MacroView macros={macros} />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label={`${name} options`}
              />
            }
          >
            <EllipsisVertical className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setCopyOpen(true)}>
              Copy to…
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <MacroBar macros={macros} />

      {items.length > 0 && (
        <ul className="flex flex-col divide-y border bg-muted/50">
          {items.map((item) => (
            <FoodEntryRow
              key={item.id}
              item={item}
              onDelete={() => onDeleteEntry?.(item)}
            />
          ))}
        </ul>
      )}

      <Button
        variant="outline"
        className="w-full justify-center gap-2 "
        onClick={onAddFood}
      >
        <PlusIcon className="size-4" />
        Add food
      </Button>

      {copyOpen && (
        <CopyBlockDrawer sourceBlock={block} onOpenChange={setCopyOpen} />
      )}
    </section>
  );
};
