import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { WeightForm } from "./WeightForm";
import { WeightChart } from "./WeightChart";
import { WeightOverview } from "./WeightOverview";
import { useWeightEntries } from "./use-weight-entries";

const Weight = () => {
  const { data, error, refetch } = useWeightEntries();
  const [editingId, setEditingId] = useState<number | null>(null);

  const entries = data ?? [];
  const editingEntry = entries.find((e) => e.id === editingId);

  return (
    <div className="w-full flex flex-col gap-4 md:p-4 mx-auto max-w-6xl">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Could not load weight entries</AlertTitle>
          <AlertDescription>
            <p>{error.message}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => void refetch()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {data ? <WeightChart data={entries} /> : null}
      <div className="gap-4 grid md:grid-cols-2 items-stretch">
        <WeightForm
          key={editingId ?? "new"}
          entry={editingEntry}
          onDone={() => setEditingId(null)}
        />

        {data ? (
          <WeightOverview
            entries={entries}
            onEdit={(entry) => setEditingId(entry.id)}
          />
        ) : null}
      </div>
    </div>
  );
};

export default Weight;
