import { useFieldArray, useForm, type DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { toast } from "@/components/ui/toast";

const MAX_FILE_SZIE = 10 * 1024 * 1024; // 10 MiB

const measurements = [
  { name: "Chest", lengthCm: undefined },
  { name: "Waist", lengthCm: undefined },
  { name: "Bicep", lengthCm: undefined },
  { name: "Thigh", lengthCm: undefined },
];

const schema = z.object({
  date: z.string().min(1),
  weight: z.number().positive().max(500),
  photos: z.array(
    z.file().max(MAX_FILE_SZIE).mime(["image/jpeg", "image/png"]),
  ),
  measurements: z.array(
    z.object({ name: z.string(), lengthCm: z.number().positive() }),
  ),
});

type FormValues = z.infer<typeof schema>;

interface WeightEntry {
  id: number;
  date: string;
  weightKg: number;
  measurements: { id: number; name: string; lengthCm: number }[];
  photos: { id: number; fileName: string; contentHash: string }[];
}

const today = new Date().toISOString().slice(0, 10);
const defaultValues: DefaultValues<FormValues> = {
  date: today,
  weight: "" as unknown as number,
  photos: [],
  measurements,
};

export const WeightForm = () => {
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
    defaultValues,
  });

  const { fields, remove } = useFieldArray({
    control,
    name: "measurements",
  });

  const saveEntry = useMutation({
    mutationFn: (formData: FormData) =>
      api.post<WeightEntry>("/weight", formData),
    onSuccess: () => {
      toast.add({ title: "Weight entry saved", type: "success" });
      reset(defaultValues);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? (Object.values(error.fieldErrors).flat()[0] ?? error.message)
          : error.message;
      toast.add({
        title: "Could not save weight entry",
        description: message,
        type: "error",
      });
    },
  });

  const onSave = (data: FormValues) => {
    const formData = new FormData();
    formData.append("date", data.date);
    formData.append("weightkg", String(data.weight));
    formData.append("measurementsjson", JSON.stringify(data.measurements));
    data.photos.forEach((file) => formData.append("photos", file));
    if (photosRef.current) photosRef.current.value = "";
    saveEntry.mutate(formData);
  };

  return (
    <form
      onSubmit={(event) => handleSubmit(onSave)(event)}
      encType="multipart/form-data"
      className="space-y-4 md:space-y-8"
    >
      <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field data-invalid={!!errors.weight}>
          <FieldLabel htmlFor="weight">Weight (kg)</FieldLabel>
          <Input
            id="weight"
            type="number"
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

      <Field data-invalid={!!errors.photos}>
        <FieldLabel htmlFor="photos">Photos</FieldLabel>
        <Input
          id="photos"
          type="file"
          multiple
          onChange={(e) =>
            setValue("photos", Array.from(e.target.files ?? []), {
              shouldValidate: true,
            })
          }
          ref={photosRef}
        />
        <FieldError errors={[errors.photos]} />
      </Field>

      <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((m, i) => (
          <Field key={m.id}>
            <FieldLabel htmlFor={`measurement-${i}`}>{m.name}</FieldLabel>

            <div className="flex items-center gap-2">
              <Input
                id={`measurement-${i}`}
                type="number"
                {...register(`measurements.${i}.lengthCm`, {
                  valueAsNumber: true,
                })}
              />

              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove ${m.name}`}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash className="size-4" />
              </Button>
            </div>

            <FieldError errors={[errors.measurements?.[i]?.lengthCm]} />
          </Field>
        ))}
      </FieldGroup>
      <Button className={"w-full mt-4"} type="submit">
        Save
      </Button>
    </form>
  );
};
