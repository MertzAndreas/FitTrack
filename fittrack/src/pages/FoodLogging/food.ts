import {
  Coffee,
  Cookie,
  Hamburger,
  Sandwich,
  type LucideIcon,
} from "lucide-react";

export type MacroName = "Carbs" | "Protein" | "Fat";

export const MACRO_COLORS: Record<MacroName, string> = {
  Carbs: "var(--vivid-1)",
  Protein: "var(--vivid-2)",
  Fat: "var(--vivid-3)",
};

export function getServingInfo(food: Food) {
  const grams = food.servingQuantity;
  if (typeof grams !== "number" || !Number.isFinite(grams) || grams <= 0) {
    return null;
  }
  return {
    grams,
    label: food.servingSize?.trim() || `${Number(grams.toFixed(2))} g`,
  };
}

export type IconKey = "coffee" | "sandwich" | "burger" | "cookie";

export const IconMap: Record<IconKey, LucideIcon> = {
  burger: Hamburger,
  coffee: Coffee,
  sandwich: Sandwich,
  cookie: Cookie,
};

export type FoodSource = "OpenFoodFacts" | "User";

export type Food = {
  id: number;
  name: string;
  brands?: string;
  code?: string;
  img?: string;
  category?: string;
  source: FoodSource;
  servingSize?: string;
  servingQuantity?: number;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
};

export type FoodItem = {
  id: number;
  quantity: number;
  food: Food;
};

export type Block = {
  id: number;
  name: string;
  sortOrder: number;
  iconKey: IconKey;
  entries: FoodItem[];
};

export type Macros = {
  kcal: number;
  carbs: number;
  protein: number;
  fat: number;
};

export function calculateItemMacros(item: Omit<FoodItem, "id">): Macros {
  const ratio = item.quantity / 100;
  return {
    kcal: Math.round(item.food.kcalPer100g * ratio),
    protein: +Math.round(item.food.proteinPer100g * ratio),
    carbs: +Math.round(item.food.carbsPer100g * ratio),
    fat: +Math.round(item.food.fatPer100g * ratio),
  };
}

export function calculateMealMacros(meal: Block): Macros {
  return meal.entries.reduce(
    (totals, item) => {
      const m = calculateItemMacros(item);
      return {
        kcal: totals.kcal + m.kcal,
        protein: +(totals.protein + m.protein).toFixed(1),
        carbs: +(totals.carbs + m.carbs).toFixed(1),
        fat: +(totals.fat + m.fat).toFixed(1),
      };
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export function calculateMealsMacros(meals: Block[]): Macros {
  return meals.reduce(
    (totals, item) => {
      const m = calculateMealMacros(item);
      return {
        kcal: totals.kcal + m.kcal,
        protein: +(totals.protein + m.protein).toFixed(1),
        carbs: +(totals.carbs + m.carbs).toFixed(1),
        fat: +(totals.fat + m.fat).toFixed(1),
      };
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}
