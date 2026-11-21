import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DraftFoodItem } from "../food";
import { FoodEntryRow } from "../FoodEntryRow";

type DraftsSectionProps = {
  entries: DraftFoodItem[];
  onEdit: (localId: string) => void;
  onRemove: (localId: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
};

export const DraftsSection = ({
  entries,
  onEdit,
  onRemove,
  onSubmit,
  isSubmitting,
}: DraftsSectionProps) => (
  <>
    <CardHeader>
      <CardTitle>Currently selected</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <ul className="flex flex-col divide-y border bg-muted/50">
        {entries.map((entry) => (
          <FoodEntryRow
            key={entry.localId}
            item={entry}
            onEdit={() => onEdit(entry.localId)}
            onDelete={() => onRemove(entry.localId)}
          />
        ))}
      </ul>
      <Button className="w-full" onClick={onSubmit} disabled={isSubmitting}>
        <Check />
        {isSubmitting ? "Adding…" : `Add ${entries.length} to meal`}
      </Button>
    </CardContent>
  </>
);
