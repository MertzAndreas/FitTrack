import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router";
import { format } from "date-fns";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReactNode } from "react";
import { useMemo, useRef } from "react";
import type { MeasurementSite, WeightEntry } from "./types";
import {
  useMeasurementSites,
  useTrackedMeasurements,
  useUpsertWeightEntry,
  useWeightEntries,
} from "./use-weight-entries";
import { WeightPhotos } from "./WeightPhotos";
import {
  getDefaultValues,
  schema,
  toFormValues,
  type FormValues,
} from "./weight-form-schema";

const blankToUndefined = (value: unknown) => {
  if (typeof value !== "string") return value;
  return value.trim() === "" ? undefined : Number(value);
};

const FormCard = ({
  entry,
  children,
}: {
  entry?: WeightEntry;
  children: ReactNode;
}) => (
  <Card className="flex flex-col">
    <CardHeader>
      <CardTitle>{entry ? "Edit Weight" : "Log Weight"}</CardTitle>
    </CardHeader>
    <CardContent className="flex-1">{children}</CardContent>
  </Card>
);

type WeightFormProps = {
  entry?: WeightEntry;
  onDone?: () => void;
};

export const WeightForm = ({ entry, onDone }: WeightFormProps) => {
  const sitesQuery = useMeasurementSites();
  const trackedQuery = useTrackedMeasurements();

  if (!entry && (sitesQuery.isPending || trackedQuery.isPending))
    return (
      <FormCard entry={entry}>
        <p className="text-sm text-muted-foreground">Loading measurements…</p>
      </FormCard>
    );

  if (!entry && (!sitesQuery.data || !trackedQuery.data))
    return (
      <FormCard entry={entry}>
        <p className="text-sm text-muted-foreground">
          Could not load measurements.
        </p>
      </FormCard>
    );

  return (
    <WeightFormFields
      entry={entry}
      onDone={onDone}
      sites={sitesQuery.data ?? []}
      trackedSites={trackedQuery.data ?? []}
    />
  );
};

type WeightFormFieldsProps = WeightFormProps & {
  sites: MeasurementSite[];
  trackedSites: number[];
};

const WeightFormFields = ({
  entry,
  onDone,
  sites,
  trackedSites,
}: WeightFormFieldsProps) => {
  const photosRef = useRef<HTMLInputElement>(null);
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: entry
      ? toFormValues(entry)
      : getDefaultValues(trackedSites, sites),
  });

  const { fields } = useFieldArray({
    control,
    name: "measurements",
  });

  const { data: entries = [] } = useWeightEntries();
  const date = useWatch({ control, name: "date" });

  const lastValues = useMemo(() => {
    const values = new Map<number, number>();
    if (!date) return values;
    for (const entry of entries) {
      if (format(entry.date, "yyyy-MM-dd") >= date) continue;
      for (const m of entry.measurements) values.set(m.site, m.lengthCm);
    }
    return values;
  }, [entries, date]);

  const saveEntry = useUpsertWeightEntry();

  const onSave = (data: FormValues) => {
    const formData = new FormData();
    formData.append("date", data.date);
    formData.append("weightkg", String(data.weight));
    formData.append(
      "measurementsjson",
      JSON.stringify(
        data.measurements.flatMap((m) =>
          m.lengthCm === undefined
            ? []
            : [{ site: m.site, lengthCm: m.lengthCm }],
        ),
      ),
    );
    data.photos.forEach((file) => formData.append("photos", file));

    saveEntry.mutate(formData, {
      onSuccess: () => {
        reset(getDefaultValues(trackedSites, sites));
        if (photosRef.current) photosRef.current.value = "";
        onDone?.();
      },
    });
  };

  return (
    <FormCard entry={entry}>
      <form
        onSubmit={(event) => handleSubmit(onSave)(event)}
        encType="multipart/form-data"
        className="flex flex-col h-full gap-4 md:gap-8"
      >
        <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <Field data-invalid={!!errors.weight}>
            <FieldLabel htmlFor="weight">Weight (kg)</FieldLabel>
            <Input
              id="weight"
              type={"number"}
              step={"any"}
              aria-invalid={!!errors.weight}
              {...register("weight", { valueAsNumber: true })}
            />
            <FieldError errors={[errors.weight]} />
          </Field>
          <Field data-invalid={!!errors.date}>
            <FieldLabel htmlFor="date">Date</FieldLabel>
            <Input id="date" type="date" {...register("date")} />
            <FieldError errors={[errors.date]} />
          </Field>
        </FieldGroup>

        <WeightPhotos
          entry={entry}
          photosRef={photosRef}
          onFilesChange={(files) =>
            setValue("photos", files, { shouldValidate: true })
          }
          error={errors.photos}
        />

        {fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No measurements tracked yet.{" "}
            <Link
              to="/settings"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Choose them in Settings
            </Link>
            .
          </p>
        ) : (
          <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {fields.map((m, i) => {
              const last = lastValues.get(m.site);
              return (
                <Field key={m.id}>
                  <FieldLabel htmlFor={`measurement-${m.id}`}>
                    {m.name}
                  </FieldLabel>

                  <Input
                    id={`measurement-${m.id}`}
                    type="number"
                    step={"any"}
                    placeholder={last === undefined ? "cm" : `Last: ${last} cm`}
                    {...register(`measurements.${i}.lengthCm`, {
                      setValueAs: blankToUndefined,
                    })}
                  />

                  <FieldError errors={[errors.measurements?.[i]?.lengthCm]} />
                </Field>
              );
            })}
          </FieldGroup>
        )}

        <div className="mt-auto flex gap-2">
          {entry && (
            <Button
              className="flex-1"
              variant="outline"
              type="button"
              onClick={onDone}
            >
              Cancel
            </Button>
          )}
          <Button className="flex-1" type="submit">
            Save
          </Button>
        </div>
      </form>
    </FormCard>
  );
};
