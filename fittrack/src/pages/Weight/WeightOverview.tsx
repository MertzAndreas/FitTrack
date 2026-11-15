import { useState } from "react";
import { format, startOfDay } from "date-fns";

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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WeightEntry } from "./types";
import { LoggedDaysRing } from "./Stats/LoggedDaysRing";
import { useDeleteWeightEntry, weightPhotoUrl } from "./use-weight-entries";

const EntryDetails = ({
  entry,
  onClose,
  onEdit,
}: {
  entry: WeightEntry;
  onClose: () => void;
  onEdit: (entry: WeightEntry) => void;
}) => {
  const deleteEntry = useDeleteWeightEntry();

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{format(entry.date, "d MMMM yyyy")}</DialogTitle>
        <DialogDescription>{entry.weightKg.toFixed(1)} kg</DialogDescription>
      </DialogHeader>

      {entry.measurements.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {entry.measurements.map((m) => (
            <div key={m.id} className="flex justify-between">
              <dt className="text-muted-foreground">{m.name}</dt>
              <dd>{m.lengthCm} cm</dd>
            </div>
          ))}
        </dl>
      )}

      {entry.photos.length > 0 && (
        <div className="grid max-h-[50vh] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
          {entry.photos.map((photo, i) => (
            <img
              key={photo.id}
              src={weightPhotoUrl(photo.id)}
              alt={`Photo ${i + 1}`}
              loading="lazy"
              className="aspect-square w-full object-cover"
            />
          ))}
        </div>
      )}

      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => {
            onEdit(entry);
            onClose();
          }}
        >
          Edit
        </Button>
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="destructive" />}>
            Delete
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete entry?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently deletes the entry, including its measurements
                and photos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() =>
                  deleteEntry.mutate(entry.id, { onSuccess: onClose })
                }
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogFooter>
    </DialogContent>
  );
};

export const WeightOverview = ({
  entries,
  onEdit,
}: {
  entries: WeightEntry[];
  onEdit: (entry: WeightEntry) => void;
}) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = entries.find((e) => e.id === selectedId);

  const entryByDay = new Map(
    entries.map((e) => [startOfDay(e.date).getTime(), e] as const),
  );
  const loggedDays = entries.map((e) => startOfDay(e.date));
  const today = startOfDay(new Date());

  const handleSelect = (day: Date | undefined) => {
    if (!day) return;
    const entry = entryByDay.get(startOfDay(day).getTime());
    if (entry) setSelectedId(entry.id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>History</CardTitle>
        <CardDescription>
          {entries.length} entries · tap a marked day to view it
        </CardDescription>
        <CardAction>
          <LoggedDaysRing entries={entries} />
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        <Calendar
          mode="single"
          className="w-full"
          showOutsideDays={false}
          selected={selected?.date}
          onSelect={handleSelect}
          disabled={[
            { after: today },
            (day: Date) => !entryByDay.has(startOfDay(day).getTime()),
          ]}
          modifiers={{ logged: loggedDays }}
          modifiersClassNames={{
            logged:
              "relative [&>button]:font-extrabold after:pointer-events-none after:absolute after:bottom-3 after:left-1/2 after:z-20 after:size-1.5 after:-translate-x-1/2 after:bg-primary",
          }}
          classNames={{ disabled: "text-muted-foreground/70" }}
        />
      </CardContent>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelectedId(null)}
      >
        {selected && (
          <EntryDetails
            entry={selected}
            onClose={() => setSelectedId(null)}
            onEdit={onEdit}
          />
        )}
      </Dialog>
    </Card>
  );
};
