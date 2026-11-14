import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Pencil, Check, X } from "lucide-react";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  type FoodItem,
  type Food,
  getServingInfo,
  calculateItemMacros,
  MACRO_COLORS,
} from "./food";
import { FoodEntryRow } from "./FoodEntryRow";
import { ImageBox } from "./ImageBox";
import { MacroView } from "./MacroView";
import { useSearchFood, useSubmitFoodEntries } from "./use-food-logging";
import { useSelectedDay } from "./use-selected-day";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Unit = "g" | "serving";

export type DraftFoodItem = Omit<FoodItem, "id"> & { localId: string };

const round = (value: number) => Math.round(value * 100) / 100;

const MACRO_TILES = [
  { key: "carbs", label: "Carbs" },
  { key: "protein", label: "Protein" },
  { key: "fat", label: "Fat" },
] as const;

const SearchFoods = ({
  blockId,
  onSaved,
}: {
  blockId: number;
  onSaved?: () => void;
}) => {
  const [query, setquery] = useState<string>("");
  const [food, setFood] = useState<Food | null>(null);
  const [unit, setUnit] = useState<Unit>("g");
  const [amount, setAmount] = useState<number>(100);
  const [foodEntries, setFoodEntries] = useState<DraftFoodItem[]>([]);
  const { data } = useSearchFood(query);
  const { dateKey } = useSelectedDay();
  const { mutate, isPending } = useSubmitFoodEntries();

  const handleSelectFood = (nextFood: Food) => {
    const serving = getServingInfo(nextFood);
    setUnit(serving ? "serving" : "g");
    setAmount(serving ? 1 : 100);
    setFood(nextFood);
  };

  const handleSubmitFoodEntries = () => {
    mutate(
      { blockId, foodEntries, dateKey },
      {
        onSuccess: () => {
          setFoodEntries([]);
          onSaved?.();
        },
      },
    );
  };

  if (food == null) {
    return (
      <Card data-block-id={blockId}>
        <CardHeader>
          <CardTitle>Search foods</CardTitle>
          <Input
            autoFocus
            value={query}
            onChange={(e) => setquery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key == "Enter" && data?.[0] != null)
                handleSelectFood(data[0]);
            }}
          />
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col divide-y bg-muted/50">
            {data?.map((food) => (
              <li key={food.id ?? food.name}>
                <button
                  onClick={() => handleSelectFood(food)}
                  className="hover:bg-accent flex w-full flex-wrap items-center gap-x-3 gap-y-2 p-3 text-left"
                >
                  <ImageBox img={food.img} alt={food.name} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{food.name}</span>
                  </div>
                  <MacroView
                    macros={calculateItemMacros({ food, quantity: 100 })}
                  />
                </button>
              </li>
            ))}
          </ul>
        </CardContent>
        {foodEntries.length > 0 && (
          <>
            <CardHeader>
              <CardTitle>Currently selected</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="flex flex-col divide-y border bg-muted/50">
                {foodEntries.map((entry) => (
                  <FoodEntryRow
                    key={entry.localId}
                    item={entry}
                    onDelete={() =>
                      setFoodEntries((prev) =>
                        prev.filter((item) => item.localId !== entry.localId),
                      )
                    }
                  />
                ))}
              </ul>
              <Button
                className="w-full"
                onClick={handleSubmitFoodEntries}
                disabled={isPending}
              >
                <Check />
                {isPending ? "Adding…" : `Add ${foodEntries.length} to meal`}
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    );
  }

  const serving = getServingInfo(food);
  const grams = unit === "serving" && serving ? amount * serving.grams : amount;
  const isValidGrams = amount >= 0.1;

  const macros = calculateItemMacros({ food, quantity: grams });

  const handleCancel = () => {
    setFood(null);
  };

  const handleConfirm = () => {
    if (!isValidGrams) return;
    setFoodEntries((prev) => [
      ...prev,
      { localId: crypto.randomUUID(), quantity: grams, food },
    ]);
    setFood(null);
    setquery("");
  };

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
      ? `${round(amount)} × ${serving.label} = ${round(grams)} g`
      : `= ${round(grams / serving.grams)} servings`
    : null;

  const subtitle = [food.brands, serving && `Serving: ${serving.label}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card data-block-id={blockId}>
      <CardHeader className="grid-cols-[auto_1fr_auto] items-center gap-4">
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
        <Button variant="secondary" className={"size-24"}>
          <Pencil className="size-6" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="border bg-primary p-4 text-primary-foreground">
            <p className="text-xs font-semibold uppercase tracking-widest opacity-80">
              Calories
            </p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">
              {macros.kcal}
              <span className="ml-1 text-sm font-normal">kcal</span>
            </p>
          </div>
          {MACRO_TILES.map(({ key, label }) => {
            return (
              <div key={key} className="border bg-muted/50 p-4">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  <span
                    aria-hidden
                    className="size-2"
                    style={{ backgroundColor: MACRO_COLORS[label] }}
                  />
                  {label}
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {macros[key]}g
                </p>
              </div>
            );
          })}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <Label>Amount</Label>
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
              aria-invalid={!isValidGrams}
              value={amount}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirm();
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
        <div className="flex gap-3">
          <Button
            size={"lg"}
            className="flex-1"
            disabled={!isValidGrams}
            onClick={handleConfirm}
          >
            <Check /> Confirm
          </Button>
          <Button size={"lg"} variant="outline" onClick={handleCancel}>
            <X />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchFoods;
