import { Check, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  calculateItemMacros,
  getServingInfo,
  type Food,
} from "../food";
import { ImageBox } from "../ImageBox";
import { MacroTiles } from "./MacroTiles";

type Unit = "g" | "serving";

type FoodDetailsCardProps = {
  food: Food;
  initialGrams?: number;
  mealCount: number;
  isSubmitting: boolean;
  onConfirm: (quantity: number, submit: boolean) => void;
  onCancel: () => void;
};

const round = (value: number) => Math.round(value * 100) / 100;

export const FoodDetailsCard = ({
  food,
  initialGrams,
  mealCount,
  isSubmitting,
  onConfirm,
  onCancel,
}: FoodDetailsCardProps) => {
  const serving = getServingInfo(food);
  const isEditing = initialGrams !== undefined;
  const [unit, setUnit] = useState<Unit>(
    isEditing ? "g" : serving ? "serving" : "g",
  );
  const [amount, setAmount] = useState<number>(
    isEditing ? initialGrams : serving ? 1 : 100,
  );

  const grams = unit === "serving" && serving ? amount * serving.grams : amount;
  const safeGrams = Number.isFinite(grams) ? grams : 0;
  const isValid = safeGrams >= 0.1;
  const macros = calculateItemMacros({ food, quantity: safeGrams });

  const changeUnit = (next: Unit) => {
    if (next === unit) return;
    if (serving) {
      setAmount((prev) =>
        round(next === "serving" ? prev / serving.grams : prev * serving.grams),
      );
    }
    setUnit(next);
  };

  const hint = serving
    ? unit === "serving"
      ? `${round(amount)} × ${serving.label} = ${round(safeGrams)} g`
      : `= ${round(safeGrams / serving.grams)} servings`
    : null;

  const subtitle = [food.brands, serving && `Serving: ${serving.label}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <CardHeader className="grid-cols-[auto_1fr] items-center gap-4">
        <ImageBox className="size-24" img={food.img} alt={food.name} />
        <div className="min-w-0 space-y-1">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            Select amount of
          </span>
          <CardTitle className="truncate text-xl normal-case tracking-normal">
            {food.name}
          </CardTitle>
          {subtitle && (
            <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <MacroTiles macros={macros} />
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="select-amount">Amount</Label>
            {serving && (
              <ToggleGroup
                variant="outline"
                spacing={0}
                aria-label="Amount unit"
                value={[unit]}
                onValueChange={(value) => {
                  const next = value[0];
                  if (next === "g" || next === "serving") changeUnit(next);
                }}
              >
                <ToggleGroupItem value="g" className="h-8 px-3">
                  Grams
                </ToggleGroupItem>
                <ToggleGroupItem value="serving" className="h-8 px-3">
                  Servings
                </ToggleGroupItem>
              </ToggleGroup>
            )}
          </div>
          <div className="relative">
            <Input
              autoFocus
              id="select-amount"
              type="number"
              step="any"
              aria-invalid={!isValid}
              value={amount}
              onChange={(e) => {
                const next = Number(e.target.value);
                setAmount(Number.isFinite(next) ? Math.max(0, next) : 0);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && isValid && !isSubmitting)
                  onConfirm(safeGrams, false);
              }}
              className="h-14 pr-28 text-3xl font-semibold tabular-nums"
            />
            <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-widest">
              {unit === "g" ? "grams" : "serving"}
            </span>
          </div>
          {hint && (
            <p className="text-xs tabular-nums text-muted-foreground">{hint}</p>
          )}
        </div>
        <div className="flex flex-col gap-5">
          <div className="flex gap-3">
            <Button
              size="lg"
              className="flex-1"
              disabled={isSubmitting || !isValid}
              onClick={() => onConfirm(safeGrams, false)}
            >
              <Check /> {isEditing ? "Save changes" : "Add to list"}
            </Button>
            <Button size="lg" variant="outline" onClick={onCancel}>
              <X />
              Cancel
            </Button>
          </div>
          {mealCount > 0 && (
            <Button
              disabled={isSubmitting || !isValid}
              onClick={() => onConfirm(safeGrams, true)}
              size="lg"
              variant="secondary"
            >
              {isSubmitting ? "Adding…" : `Add ${mealCount} to meal`}
            </Button>
          )}
        </div>
      </CardContent>
    </>
  );
};
