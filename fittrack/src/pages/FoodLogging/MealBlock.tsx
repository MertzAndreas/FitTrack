import {
  EllipsisVertical,
  PlusIcon,
  TrashIcon,
  Utensils,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { calculateItemMacros, calculateMealMacros, type Meal } from "./food";
import { MacroBar, MacroView } from "./MacroView";

const ImageBox = ({ img, alt }: { img?: string; alt: string }) => (
  <div className="size-12 shrink-0 overflow-hidden border bg-accent">
    {img ? (
      <img
        src={img}
        alt={alt}
        loading="lazy"
        className="size-full object-cover"
      />
    ) : (
      <div className="size-full flex items-center justify-center text-muted-foreground">
        <Utensils className="size-5" aria-hidden />
      </div>
    )}
  </div>
);

export const MealBlock = ({ meal }: { meal: Meal }) => {
  const { icon: Icon, name, items } = meal;
  const macros = calculateMealMacros(meal);

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
        <Button variant="ghost" size="icon" aria-label={`${name} options`}>
          <EllipsisVertical className="size-5" />
        </Button>
      </header>

      <MacroBar macros={macros} />

      {items.length > 0 ? (
        <ul className="flex flex-col divide-y border bg-muted/50">
          {items.map((fi) => (
            <li
              key={fi.food.id ?? fi.food.name}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3 sm:flex-nowrap"
            >
              <ImageBox img={fi.food.img} alt={fi.food.name} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{fi.food.name}</span>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {fi.quantity} g
                </span>
              </div>
              <div className="order-last w-full sm:order-0 sm:w-auto">
                <MacroView macros={calculateItemMacros(fi)} />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${fi.food.name}`}
              >
                <TrashIcon className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border border-dashed p-4 text-center text-sm text-muted-foreground">
          Nothing logged for {name.toLowerCase()} yet.
        </p>
      )}

      <Button variant="outline" className="w-full justify-center gap-2 ">
        <PlusIcon className="size-4" />
        Add food
      </Button>
    </section>
  );
};
