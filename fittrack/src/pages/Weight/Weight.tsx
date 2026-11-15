import { useState } from "react";
import { format } from "date-fns";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { WeightForm } from "./WeightForm";
import { WeightChart } from "./WeightChart";
import { WeightOverview } from "./WeightOverview";
import { useWeightEntries } from "./use-weight-entries";
import WeightStats from "./WeightStats";

const Weight = () => {
  const { data, error, refetch } = useWeightEntries();
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));

  const entries = data ?? [];

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
      {data ? <WeightStats data={entries} /> : null}

      <div className="gap-4 grid md:grid-cols-2 items-stretch">
        <WeightForm date={date} onDateChange={setDate} />

        {data ? (
          <WeightOverview
            entries={entries}
            onEdit={(entry) => setDate(format(entry.date, "yyyy-MM-dd"))}
          />
        ) : null}
      </div>
    </div>
  );
};

export default Weight;
