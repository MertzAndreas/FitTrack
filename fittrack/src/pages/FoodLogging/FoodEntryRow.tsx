import { cn } from "cn";
import { TrashIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { calculateItemMacros, type FoodItem } from "./food";
import { ImageBox } from "./ImageBox";
import { MacroView } from "./MacroView";

type FoodEntryRowProps = {
  item: Omit<FoodItem, "id">;
  onEdit?: () => void;
  onDelete?: () => void;
};

export const FoodEntryRow = ({
  item,
  onEdit,
  onDelete,
}: FoodEntryRowProps) => (
  <li
    className={cn(
      "flex flex-wrap items-center gap-x-3 gap-y-2 p-3 sm:flex-nowrap",
      onEdit && "cursor-pointer hover:bg-accent",
    )}
    onClick={onEdit}
    onKeyDown={(event) => {
      if (!onEdit || event.target !== event.currentTarget) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onEdit();
      }
    }}
    role={onEdit ? "button" : undefined}
    tabIndex={onEdit ? 0 : undefined}
    aria-label={onEdit ? `Edit ${item.food.name}` : undefined}
  >
    <ImageBox img={item.food.img} alt={item.food.name} />
    <div className="flex min-w-0 flex-1 flex-col">
      <span className="truncate font-medium">{item.food.name}</span>
      <span className="text-sm tabular-nums text-muted-foreground">
        {item.quantity} g
      </span>
    </div>
    <div className="order-last w-full sm:order-0 sm:w-auto">
      <MacroView macros={calculateItemMacros(item)} />
    </div>
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground hover:text-destructive"
      aria-label={`Remove ${item.food.name}`}
      onClick={(event) => {
        event.stopPropagation();
        onDelete?.();
      }}
    >
      <TrashIcon className="size-4" />
    </Button>
  </li>
);
