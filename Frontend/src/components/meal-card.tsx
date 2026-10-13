import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FoodRow } from '@/components/food-row'
import { MealItemAddSheet } from '@/components/meal-item-add-sheet'
import { MealItemEditSheet } from '@/components/meal-item-edit-sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'
import {
  createItem,
  getFood,
  sumItems,
  type Food,
  type MealBlock,
  type MealItem,
} from '@/lib/meals'

type MealCardProps = {
  block: MealBlock
  foods: Food[]
  onChange: (block: MealBlock) => void
  onRemove: () => void
}

const round = (n: number) => Math.round(n)

export function MealCard({ block, foods, onChange, onRemove }: MealCardProps) {
  const [editing, setEditing] = useState<MealItem | null>(null)
  const [adding, setAdding] = useState(false)

  const totals = sumItems(block.items)

  const patch = (changes: Partial<MealBlock>) => onChange({ ...block, ...changes })

  const submitItem = (foodId: string, amount: number) => {
    if (editing) {
      patch({
        items: block.items.map((i) =>
          i.id === editing.id ? { ...i, foodId, amount } : i
        ),
      })
    } else {
      patch({ items: [...block.items, createItem(foodId, amount)] })
    }
  }

  const deleteItem = () => {
    if (!editing) return
    patch({ items: block.items.filter((i) => i.id !== editing.id) })
  }

  return (
    <Card size="sm">
      <CardHeader className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <Input
          value={block.name}
          onChange={(e) => patch({ name: e.target.value })}
          className="h-auto min-w-0 flex-1 basis-32 border-none bg-transparent p-0 font-heading text-sm leading-none font-semibold tracking-wider uppercase shadow-none focus-visible:ring-0"
          aria-label="Block name"
        />
        <span className="ml-auto flex shrink-0 items-baseline gap-2 text-xs tabular-nums">
          <span className="font-heading text-base">
            {round(totals.kcal)}
            <span className="ml-0.5 text-[0.65rem] font-normal tracking-widest text-muted-foreground">
              KCAL
            </span>
          </span>
          <span className="text-muted-foreground">
            {round(totals.protein)}P · {round(totals.carbs)}C · {round(totals.fat)}F
          </span>
        </span>
      </CardHeader>

      <CardContent className="space-y-3">
        {block.items.length > 0 ? (
          <ul className="space-y-1.5">
            {block.items.map((item) => {
              const food = getFood(item.foodId)
              if (!food) return null

              return (
                <li key={item.id}>
                  <FoodRow
                    food={food}
                    amount={item.amount}
                    onClick={() => setEditing(item)}
                  />
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground/60 italic">Nothing logged</p>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAdding(true)}
            className="text-muted-foreground"
          >
            <Plus />
            Add item
          </Button>

          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                />
              }
            >
              Remove block
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove “{block.name}”?</AlertDialogTitle>
                <AlertDialogDescription>
                  {block.items.length > 0
                    ? `This deletes the block and its ${block.items.length} item${
                        block.items.length === 1 ? '' : 's'
                      }.`
                    : 'This deletes the block.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={onRemove}
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>

      <MealItemAddSheet
        open={adding}
        onOpenChange={setAdding}
        foods={foods}
        onSubmit={submitItem}
      />

      {editing ? (
        <MealItemEditSheet
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null)
          }}
          foods={foods}
          item={editing}
          onSubmit={submitItem}
          onDelete={deleteItem}
        />
      ) : null}
    </Card>
  )
}
