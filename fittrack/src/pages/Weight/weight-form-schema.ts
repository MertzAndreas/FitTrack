import { format } from "date-fns";
import type { DefaultValues } from "react-hook-form";
import { z } from "zod";
import type { MeasurementSite, WeightEntry } from "./types";

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MiB

export const schema = z.object({
  date: z.string().min(1),
  weight: z.number().positive().max(500),
  photos: z.array(
    z.file().max(MAX_FILE_SIZE).mime(["image/jpeg", "image/png"]),
  ),
  measurements: z.array(
    z.object({
      site: z.number().int(),
      name: z.string(),
      lengthCm: z.number().positive().optional(),
    }),
  ),
});

export type FormValues = z.infer<typeof schema>;

export const getDefaultValues = (
  trackedSites: number[],
  sites: MeasurementSite[],
): DefaultValues<FormValues> => ({
  date: new Date().toISOString().slice(0, 10),
  weight: "" as unknown as number,
  photos: [],
  measurements: sites
    .filter((site) => trackedSites.includes(site.id))
    .map((site) => ({
      site: site.id,
      name: site.name,
      lengthCm: undefined,
    })),
});

export const toFormValues = (entry: WeightEntry): DefaultValues<FormValues> => ({
  date: format(entry.date, "yyyy-MM-dd"),
  weight: entry.weightKg,
  photos: [],
  measurements: entry.measurements.map((m) => ({
    site: m.site,
    name: m.name,
    lengthCm: m.lengthCm,
  })),
});
