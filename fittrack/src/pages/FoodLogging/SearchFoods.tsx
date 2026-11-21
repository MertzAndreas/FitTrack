import { useState, type RefObject } from "react";
import { Card } from "@/components/ui/card";
import type { DraftFoodItem, Food } from "./food";
import { BarcodeCamera } from "./SearchFoods/BarcodeCamera";
import { DraftsSection } from "./SearchFoods/DraftsSection";
import { FoodDetailsCard } from "./SearchFoods/FoodDetailsCard";
import { FoodSearchPanel } from "./SearchFoods/FoodSearchPanel";
import { useSubmitFoodEntries } from "./use-food-logging";
import { useSelectedDay } from "./use-selected-day";

type View =
  | { kind: "search" }
  | { kind: "camera" }
  | { kind: "amount"; food: Food };

type SearchFoodsProps = {
  blockId: number;
  onSaved?: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
};

const SearchFoods = ({ blockId, onSaved, inputRef }: SearchFoodsProps) => {
  const [view, setView] = useState<View>({ kind: "search" });
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState<DraftFoodItem[]>([]);
  const { dateKey } = useSelectedDay();
  const { mutate, isPending } = useSubmitFoodEntries();

  const submitEntries = (entries: DraftFoodItem[]) => {
    mutate(
      { blockId, foodEntries: entries, dateKey },
      {
        onSuccess: () => {
          setDrafts([]);
          onSaved?.();
        },
      },
    );
  };

  const addDraft = (quantity: number, submit: boolean) => {
    if (view.kind !== "amount") return;
    const next = [
      ...drafts,
      { localId: crypto.randomUUID(), quantity, food: view.food },
    ];

    setDrafts(next);
    setQuery("");
    setView({ kind: "search" });
    if (submit) submitEntries(next);
  };

  if (view.kind === "camera") {
    return (
      <BarcodeCamera
        onSelect={(food) => setView({ kind: "amount", food })}
        onClose={() => setView({ kind: "search" })}
      />
    );
  }

  return (
    <Card>
      {view.kind === "amount" ? (
        <FoodDetailsCard
          key={view.food.id}
          food={view.food}
          draftCount={drafts.length}
          isSubmitting={isPending}
          onConfirm={addDraft}
          onCancel={() => setView({ kind: "search" })}
        />
      ) : (
        <>
          <FoodSearchPanel
            inputRef={inputRef}
            query={query}
            onQueryChange={setQuery}
            onSelect={(food) => setView({ kind: "amount", food })}
            onOpenCamera={() => setView({ kind: "camera" })}
          />
          {drafts.length > 0 && (
            <DraftsSection
              entries={drafts}
              onRemove={(localId: string) =>
                setDrafts((prev) =>
                  prev.filter((entry) => entry.localId !== localId),
                )
              }
              onSubmit={() => submitEntries(drafts)}
              isSubmitting={isPending}
            />
          )}
        </>
      )}
    </Card>
  );
};

export default SearchFoods;
