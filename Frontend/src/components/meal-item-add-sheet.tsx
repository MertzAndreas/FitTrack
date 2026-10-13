import { Search } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import type { Food } from '@/lib/meals'
import { FoodRow } from '@/components/food-row'
import { MealAmountFields } from '@/components/meal-amount-fields'

type MealItemAddSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  foods: Food[]
  onSubmit: (foodId: string, amount: number) => void
}


export function MealItemAddSheet({
  open,
  onOpenChange,
  foods,
  onSubmit,
}: MealItemAddSheetProps) {
  const [step, setStep] = useState<'search' | 'amount'>('search')
  const [query, setQuery] = useState('')
  const [foodId, setFoodId] = useState('')
  const [amount, setAmount] = useState(100)

  const selected = foods.find((f) => f.id === foodId)

  const matches = query
    ? foods.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()))
    : foods

  const reset = () => {
    setStep('search')
    setQuery('')
    setFoodId('')
    setAmount(100)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const chooseFood = (food: Food) => {
    setFoodId(food.id)
    setAmount(100)
    setStep('amount')
  }

  const confirm = () => {
    if (!foodId) return
    onSubmit(foodId, amount)
    handleOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} showSwipeHandle>
      <DrawerContent className="mx-auto max-w-xl">

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
          {step === 'search' ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search foods"
                  className="h-11 pl-9"
                  aria-label="Search foods"
                />
              </div>

              {matches.length > 0 ? (
                <ul className="space-y-1.5">
                  {matches.map((food) => (
                    <li key={food.id}>
                      <FoodRow food={food} onClick={() => chooseFood(food)} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No foods match “{query}”
                </p>
              )}
            </div>
          ) : (
            <>

              <MealAmountFields
                food={selected}
                amount={amount}
                onAmountChange={setAmount}
                onSubmit={confirm}
              />


              <div className="mt-6 flex gap-3">
                <Button size={"lg"} variant={"secondary"} onClick={() => setStep('search')}>
                  Back
                </Button>
                <Button
                  className="flex-1"
                  size="lg"
                  onClick={confirm}
                  disabled={!foodId}
                >
                  Add
                </Button>
              </div>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer >
  )
}
