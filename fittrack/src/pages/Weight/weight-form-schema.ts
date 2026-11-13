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

export const toFormValues = (
  sites: MeasurementSite[],
  trackedSites: number[],
  entry?: WeightEntry,
  date = entry
    ? format(entry.date, "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd"),
): DefaultValues<FormValues> => {
  const siteById = new Map(sites.map((site) => [site.id, site]));
  const saved = new Map(entry?.measurements.map((m) => [m.site, m]) ?? []);
  const siteIds = [...new Set([...trackedSites, ...saved.keys()])];

  return {
    date,
    weight: entry?.weightKg ?? ("" as unknown as number),
    photos: [],
    measurements: siteIds.map((siteId) => ({
      site: siteId,
      name: siteById.get(siteId)?.name ?? saved.get(siteId)?.name ?? "",
      lengthCm: saved.get(siteId)?.lengthCm,
    })),
  };
};
