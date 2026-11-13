import {
  Coffee,
  Sandwich,
  Hamburger,
  Cookie,
  type LucideIcon,
} from "lucide-react";

export type MacroName = "Carbs" | "Protein" | "Fat";

export const MACRO_COLORS: Record<MacroName, string> = {
  Carbs: "var(--vivid-1)",
  Protein: "var(--vivid-2)",
  Fat: "var(--vivid-3)",
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

export type Meal = {
  icon: LucideIcon;
  name: string;
  items: FoodItem[];
};

export const MOCK_FOODS: Food[] = [
  {
    id: 1,
    name: "Rolled Oats",
    brands: "Quaker",
    code: "0030000010402",
    img: "https://images.openfoodfacts.org/images/products/611/124/210/0992/front_en.216.400.jpg",
    category: "Grains",
    source: "OpenFoodFacts",
    servingSize: "1 bowl (40g)",
    servingQuantity: 40,
    kcalPer100g: 379,
    proteinPer100g: 13.2,
    carbsPer100g: 67.7,
    fatPer100g: 6.5,
  },
  {
    id: 2,
    name: "Whole Milk 3.5%",
    brands: "Arla",
    code: "5760466912341",
    category: "Dairy",
    source: "OpenFoodFacts",
    servingSize: "1 glass (200g)",
    servingQuantity: 200,
    kcalPer100g: 64,
    proteinPer100g: 3.4,
    carbsPer100g: 4.8,
    fatPer100g: 3.5,
  },
  {
    id: 3,
    name: "Banana",
    category: "Fruit",
    source: "User",
    servingSize: "1 medium (118g)",
    servingQuantity: 118,
    kcalPer100g: 89,
    proteinPer100g: 1.1,
    carbsPer100g: 22.8,
    fatPer100g: 0.3,
  },
  {
    id: 4,
    name: "Chicken Breast, Grilled",
    category: "Meat",
    source: "User",
    servingSize: "1 fillet (150g)",
    servingQuantity: 150,
    kcalPer100g: 165,
    proteinPer100g: 31.0,
    carbsPer100g: 0.0,
    fatPer100g: 3.6,
  },
  {
    id: 5,
    name: "Sourdough Rye Bread",
    brands: "Schulstad",
    code: "5701205001122",
    category: "Bakery",
    source: "OpenFoodFacts",
    servingSize: "1 slice (50g)",
    servingQuantity: 50,
    kcalPer100g: 215,
    proteinPer100g: 6.2,
    carbsPer100g: 41.0,
    fatPer100g: 1.8,
  },
  {
    id: 6,
    name: "Salmon Fillet, Baked",
    category: "Fish",
    source: "User",
    servingSize: "1 fillet (140g)",
    servingQuantity: 140,
    kcalPer100g: 208,
    proteinPer100g: 20.4,
    carbsPer100g: 0.0,
    fatPer100g: 13.4,
  },
  {
    id: 7,
    name: "Jasmine Rice, Cooked",
    category: "Grains",
    source: "User",
    servingSize: "1 cup (158g)",
    servingQuantity: 158,
    kcalPer100g: 130,
    proteinPer100g: 2.7,
    carbsPer100g: 28.2,
    fatPer100g: 0.3,
  },
  {
    id: 8,
    name: "Steamed Broccoli",
    category: "Vegetables",
    source: "User",
    servingSize: "1 cup (91g)",
    servingQuantity: 91,
    kcalPer100g: 35,
    proteinPer100g: 2.4,
    carbsPer100g: 7.2,
    fatPer100g: 0.4,
  },
];

export const MOCK_MEALS: Meal[] = [
  {
    icon: Coffee,
    name: "Breakfast",
    items: [
      { id: 101, quantity: 60, food: MOCK_FOODS[0] }, // 60g Rolled Oats
      { id: 102, quantity: 200, food: MOCK_FOODS[1] }, // 200g Whole Milk
      { id: 103, quantity: 118, food: MOCK_FOODS[2] }, // 118g Banana
    ],
  },
  {
    icon: Sandwich,
    name: "Lunch",
    items: [
      { id: 104, quantity: 100, food: MOCK_FOODS[4] }, // 100g Rye Bread
      { id: 105, quantity: 150, food: MOCK_FOODS[3] }, // 150g Chicken Breast
    ],
  },
  {
    icon: Hamburger,
    name: "Dinner",
    items: [
      { id: 106, quantity: 160, food: MOCK_FOODS[5] }, // 160g Salmon
      { id: 107, quantity: 180, food: MOCK_FOODS[6] }, // 180g Rice
      { id: 108, quantity: 120, food: MOCK_FOODS[7] }, // 120g Broccoli
    ],
  },
  {
    icon: Cookie,
    name: "Snacks",
    items: [], // Left empty so you can test your empty-state UI
  },
];

export type Macros = {
  kcal: number;
  carbs: number;
  protein: number;
  fat: number;
};

export function calculateItemMacros(item: FoodItem): Macros {
  const ratio = item.quantity / 100;
  return {
    kcal: Math.round(item.food.kcalPer100g * ratio),
    protein: +Math.round(item.food.proteinPer100g * ratio),
    carbs: +Math.round(item.food.carbsPer100g * ratio),
    fat: +Math.round(item.food.fatPer100g * ratio),
  };
}

export function calculateMealMacros(meal: Meal): Macros {
  return meal.items.reduce(
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

export function calculateMealsMacros(meals: Meal[]): Macros {
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
