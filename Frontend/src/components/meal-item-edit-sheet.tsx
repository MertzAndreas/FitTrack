import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import type { Food, MealItem } from '@/lib/meals'
import { MealAmountFields } from '@/components/meal-amount-fields'

type MealItemEditSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  foods: Food[]
  item: MealItem
  onSubmit: (foodId: string, amount: number) => void
  onDelete: () => void
}

export function MealItemEditSheet({
  open,
  onOpenChange,
  foods,
  item,
  onSubmit,
  onDelete,
}: MealItemEditSheetProps) {
  const [amount, setAmount] = useState(item.amount)

  const selected = foods.find((f) => f.id === item.foodId)

  const confirm = () => {
    onSubmit(item.foodId, amount)
    onOpenChange(false)
  }

  const handleDelete = () => {
    onDelete()
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent className="mx-auto max-w-lg">
        <DrawerHeader className="flex-row items-center gap-2">
          <div className="min-w-0 flex-1">
            <DrawerTitle>Amount</DrawerTitle>
          </div>
        </DrawerHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
          <MealAmountFields
            food={selected}
            amount={amount}
            onAmountChange={setAmount}
            onSubmit={confirm}
          />
          <div className="mt-6 flex gap-3">
            <Button variant="destructive" size="lg" onClick={handleDelete}>
              <Trash2 />
              Delete
            </Button>
            <Button className="flex-1" size="lg" onClick={confirm}>
              Save
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
