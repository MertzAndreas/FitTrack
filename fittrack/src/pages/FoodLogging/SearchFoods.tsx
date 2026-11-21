import { useState, type RefObject } from "react";

import { Card } from "@/components/ui/card";
import type { DraftFoodItem, Food, FoodItem } from "./food";
import { BarcodeCamera } from "./SearchFoods/BarcodeCamera";
import { DraftsSection } from "./SearchFoods/DraftsSection";
import { FoodDetailsCard } from "./SearchFoods/FoodDetailsCard";
import { FoodSearchPanel } from "./SearchFoods/FoodSearchPanel";
import {
  useSubmitFoodEntries,
  useUpdateFoodEntry,
} from "./use-food-logging";
import { useSelectedDay } from "./use-selected-day";

type AmountTarget =
  | { kind: "new"; food: Food }
  | { kind: "draft"; food: Food; localId: string; quantity: number }
  | { kind: "entry"; food: Food; entryId: number; quantity: number };

type View =
  | { kind: "search" }
  | { kind: "camera" }
  | { kind: "amount"; target: AmountTarget };

type SearchFoodsProps = {
  blockId: number;
  editEntry?: FoodItem;
  onClose?: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
};

const SearchFoods = ({
  blockId,
  editEntry,
  onClose,
  inputRef,
}: SearchFoodsProps) => {
  const [view, setView] = useState<View>(() =>
    editEntry
      ? {
          kind: "amount",
          target: {
            kind: "entry",
            food: editEntry.food,
            entryId: editEntry.id,
            quantity: editEntry.quantity,
          },
        }
      : { kind: "search" },
  );
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState<DraftFoodItem[]>([]);
  const { dateKey } = useSelectedDay();
  const { mutate: submitEntries, isPending: isSubmittingEntries } =
    useSubmitFoodEntries();
  const { mutate: updateEntry, isPending: isUpdatingEntry } =
    useUpdateFoodEntry();

  const submitDrafts = (entries: DraftFoodItem[]) => {
    submitEntries(
      { blockId, foodEntries: entries, dateKey },
      {
        onSuccess: () => {
          setDrafts([]);
          onClose?.();
        },
      },
    );
  };

  const confirmAmount = (quantity: number, submit: boolean) => {
    if (view.kind !== "amount") return;
    const target = view.target;

    if (target.kind === "entry") {
      updateEntry(
        { entryId: target.entryId, quantity, dateKey },
        { onSuccess: () => onClose?.() },
      );
      return;
    }

    if (target.kind === "draft") {
      const next = drafts.map((draft) =>
        draft.localId === target.localId ? { ...draft, quantity } : draft,
      );
      setDrafts(next);
      setView({ kind: "search" });
      if (submit) submitDrafts(next);
      return;
    }

    const next = [
      ...drafts,
      { localId: crypto.randomUUID(), quantity, food: target.food },
    ];
    setDrafts(next);
    setQuery("");
    setView({ kind: "search" });
    if (submit) submitDrafts(next);
  };

  const cancelAmount = () => {
    if (view.kind === "amount" && view.target.kind === "entry") {
      onClose?.();
      return;
    }
    setView({ kind: "search" });
  };

  const editDraft = (localId: string) => {
    const draft = drafts.find((entry) => entry.localId === localId);
    if (!draft) return;
    setView({
      kind: "amount",
      target: {
        kind: "draft",
        food: draft.food,
        localId: draft.localId,
        quantity: draft.quantity,
      },
    });
  };

  if (view.kind === "camera") {
    return (
      <BarcodeCamera
        onSelect={(food) =>
          setView({ kind: "amount", target: { kind: "new", food } })
        }
        onClose={() => setView({ kind: "search" })}
      />
    );
  }

  if (view.kind === "amount") {
    const target = view.target;
    const initialGrams = target.kind === "new" ? undefined : target.quantity;
    const mealCount =
      target.kind === "new"
        ? drafts.length + 1
        : target.kind === "draft"
          ? drafts.length
          : 0;
    const cardKey =
      target.kind === "new"
        ? `new-${target.food.id}`
        : target.kind === "draft"
          ? `draft-${target.localId}`
          : `entry-${target.entryId}`;

    return (
      <Card>
        <FoodDetailsCard
          key={cardKey}
          food={target.food}
          initialGrams={initialGrams}
          mealCount={mealCount}
          isSubmitting={
            target.kind === "entry" ? isUpdatingEntry : isSubmittingEntries
          }
          onConfirm={confirmAmount}
          onCancel={cancelAmount}
        />
      </Card>
    );
  }

  return (
    <Card>
      <FoodSearchPanel
        inputRef={inputRef}
        query={query}
        onQueryChange={setQuery}
        onSelect={(food) =>
          setView({ kind: "amount", target: { kind: "new", food } })
        }
        onOpenCamera={() => setView({ kind: "camera" })}
      />
      {drafts.length > 0 && (
        <DraftsSection
          entries={drafts}
          onEdit={editDraft}
          onRemove={(localId: string) =>
            setDrafts((prev) =>
              prev.filter((entry) => entry.localId !== localId),
            )
          }
          onSubmit={() => submitDrafts(drafts)}
          isSubmitting={isSubmittingEntries}
        />
      )}
    </Card>
  );
};

export default SearchFoods;
