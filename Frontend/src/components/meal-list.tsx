import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MealCard } from '@/components/meal-card'
import { createBlock, type Food, type MealBlock } from '@/lib/meals'

type MealListProps = {
  blocks: MealBlock[]
  foods: Food[]
  onChange: (blocks: MealBlock[]) => void
}

export function MealList({ blocks, foods, onChange }: MealListProps) {
  const updateBlock = (updated: MealBlock) => {
    onChange(blocks.map((b) => (b.id === updated.id ? updated : b)))
  }

  const removeBlock = (id: string) => {
    onChange(blocks.filter((b) => b.id !== id))
  }

  const addBlock = () => {
    onChange([...blocks, createBlock('New block')])
  }

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-lg font-semibold tracking-wider uppercase">
        Meals
      </h2>

      {blocks.map((block) => (
        <MealCard
          key={block.id}
          block={block}
          foods={foods}
          onChange={updateBlock}
          onRemove={() => removeBlock(block.id)}
        />
      ))}

      <Button variant="secondary" size="lg" onClick={addBlock} className="w-full">
        <Plus />
        Add block
      </Button>
    </div>
  )
}
