export type Food = {
  id: string
  name: string
  /** Unit the per-values are based on, e.g. 100 for "per 100 g". */
  base: number
  unit: 'g' | 'ml'
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export type MealItem = {
  id: string
  foodId: string
  amount: number
}

export type MealBlock = {
  id: string
  name: string
  items: MealItem[]
}

export type Macros = {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

const ZERO: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 }

let counter = 0
export function newId(prefix: string) {
  counter += 1
  return `${prefix}-${Date.now().toString(36)}-${counter}`
}

export function createItem(foodId: string, amount: number): MealItem {
  return { id: newId('item'), foodId, amount }
}

export function createBlock(name = '', items: MealItem[] = []): MealBlock {
  return { id: newId('block'), name, items }
}

/** The food library. Replace with a real source later. */
export const foods: Food[] = [
  { id: 'oats', name: 'Oats', base: 100, unit: 'g', kcal: 379, protein: 13, carbs: 67, fat: 6.5 },
  { id: 'milk', name: 'Milk', base: 100, unit: 'ml', kcal: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },
  { id: 'egg', name: 'Egg', base: 100, unit: 'g', kcal: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  { id: 'bread', name: 'Bread', base: 100, unit: 'g', kcal: 265, protein: 9, carbs: 49, fat: 3.2 },
  { id: 'chicken', name: 'Chicken breast', base: 100, unit: 'g', kcal: 165, protein: 31, carbs: 0, fat: 3.6 },
  { id: 'rice', name: 'Rice (cooked)', base: 100, unit: 'g', kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { id: 'salmon', name: 'Salmon', base: 100, unit: 'g', kcal: 208, protein: 20, carbs: 0, fat: 13 },
  { id: 'broccoli', name: 'Broccoli', base: 100, unit: 'g', kcal: 34, protein: 2.8, carbs: 6.6, fat: 0.4 },
  { id: 'banana', name: 'Banana', base: 100, unit: 'g', kcal: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  { id: 'apple', name: 'Apple', base: 100, unit: 'g', kcal: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  { id: 'yoghurt', name: 'Greek yoghurt', base: 100, unit: 'g', kcal: 97, protein: 9, carbs: 3.6, fat: 5 },
  { id: 'protein-shake', name: 'Protein shake', base: 100, unit: 'ml', kcal: 42, protein: 7.5, carbs: 2.1, fat: 0.6 },
  { id: 'peanut-butter', name: 'Peanut butter', base: 100, unit: 'g', kcal: 588, protein: 25, carbs: 20, fat: 50 },
  { id: 'olive-oil', name: 'Olive oil', base: 100, unit: 'ml', kcal: 884, protein: 0, carbs: 0, fat: 100 },
  { id: 'pasta', name: 'Pasta (cooked)', base: 100, unit: 'g', kcal: 158, protein: 5.8, carbs: 31, fat: 0.9 },
  { id: 'beef', name: 'Beef mince', base: 100, unit: 'g', kcal: 250, protein: 26, carbs: 0, fat: 15 },
  { id: 'potato', name: 'Potato', base: 100, unit: 'g', kcal: 77, protein: 2, carbs: 17, fat: 0.1 },
  { id: 'nuts', name: 'Mixed nuts', base: 100, unit: 'g', kcal: 607, protein: 20, carbs: 21, fat: 54 },
  { id: 'chocolate', name: 'Dark chocolate', base: 100, unit: 'g', kcal: 598, protein: 7.8, carbs: 46, fat: 43 },
  { id: 'coffee', name: 'Coffee (black)', base: 100, unit: 'ml', kcal: 2, protein: 0.1, carbs: 0, fat: 0 },
]

const byId = new Map(foods.map((f) => [f.id, f]))

export function getFood(id: string): Food | undefined {
  return byId.get(id)
}

/** Scales a food's per-`base` values to the given amount. */
export function macrosFor(foodId: string, amount: number): Macros {
  const food = byId.get(foodId)
  if (!food || !food.base) return ZERO
  const factor = (amount || 0) / food.base
  return {
    kcal: food.kcal * factor,
    protein: food.protein * factor,
    carbs: food.carbs * factor,
    fat: food.fat * factor,
  }
}

/** Totals for one block, summed from its items. */
export function sumItems(items: MealItem[]): Macros {
  return items.reduce<Macros>(
    (total, item) => {
      const m = macrosFor(item.foodId, item.amount)
      return {
        kcal: total.kcal + m.kcal,
        protein: total.protein + m.protein,
        carbs: total.carbs + m.carbs,
        fat: total.fat + m.fat,
      }
    },
    { ...ZERO }
  )
}

/** Totals across every block in a day. */
export function sumBlocks(blocks: MealBlock[]): Macros {
  return blocks.reduce<Macros>(
    (total, block) => {
      const m = sumItems(block.items)
      return {
        kcal: total.kcal + m.kcal,
        protein: total.protein + m.protein,
        carbs: total.carbs + m.carbs,
        fat: total.fat + m.fat,
      }
    },
    { ...ZERO }
  )
}

/** The blocks a fresh day starts with. */
export function defaultBlocks(): MealBlock[] {
  return ['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((name) => createBlock(name))
}
