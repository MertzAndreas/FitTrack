import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseISO } from "date-fns";
import { api, ApiError, apiUrl } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import type { MeasurementSite, WeightEntry, WeightEntryDto } from "./types";

export const weightEntriesQueryKey = ["weight-entries"] as const;
export const measurementSitesQueryKey = ["measurement-sites"] as const;
export const trackedMeasurementsQueryKey = ["tracked-measurements"] as const;

const toWeightEntry = (dto: WeightEntryDto): WeightEntry => ({
  ...dto,
  date: parseISO(dto.date),
});

export const useWeightEntries = () =>
  useQuery({
    queryKey: weightEntriesQueryKey,
    queryFn: async ({ signal }) => {
      const entries = await api.get<WeightEntryDto[]>("/weight/", { signal });
      return entries
        .map(toWeightEntry)
        .sort((a, b) => a.date.getTime() - b.date.getTime());
    },
  });

export const weightPhotoUrl = (photoId: number) =>
  apiUrl(`/weight/photos/${photoId}`);

export const useMeasurementSites = () =>
  useQuery({
    queryKey: measurementSitesQueryKey,
    queryFn: async ({ signal }) =>
      api.get<MeasurementSite[]>("/weight/measurement-types", { signal }),
    staleTime: Infinity,
    gcTime: Infinity,
  });

export const useTrackedMeasurements = () =>
  useQuery({
    queryKey: trackedMeasurementsQueryKey,
    queryFn: async ({ signal }) =>
      api.get<number[]>("/weight/tracked", { signal }),
  });

export const useSetTrackedMeasurements = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sites: number[]) =>
      api.put<number[]>("/weight/tracked", sites),
    onMutate: async (sites) => {
      await queryClient.cancelQueries({
        queryKey: trackedMeasurementsQueryKey,
      });
      const previous = queryClient.getQueryData<number[]>(
        trackedMeasurementsQueryKey,
      );
      queryClient.setQueryData(trackedMeasurementsQueryKey, sites);
      return { previous };
    },
    onError: (error, _sites, context) => {
      if (context?.previous)
        queryClient.setQueryData(
          trackedMeasurementsQueryKey,
          context.previous,
        );
      toast.add({
        title: "Could not update measurements",
        description: error.message,
        type: "error",
      });
    },
    onSettled: () =>
      void queryClient.invalidateQueries({
        queryKey: trackedMeasurementsQueryKey,
      }),
  });
};

export const useUpsertWeightEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) =>
      api.post<WeightEntryDto>("/weight/", formData),
    onSuccess: () => {
      toast.add({ title: "Weight entry saved", type: "success" });
      void queryClient.invalidateQueries({ queryKey: weightEntriesQueryKey });
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
};

export const useDeleteWeightEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId: number) => api.delete(`/weight/${entryId}`),
    onSuccess: () => {
      toast.add({ title: "Weight entry deleted", type: "success" });
      void queryClient.invalidateQueries({ queryKey: weightEntriesQueryKey });
    },
    onError: (error) => {
      toast.add({
        title: "Could not delete weight entry",
        description: error.message,
        type: "error",
      });
    },
  });
};

export const useDeleteWeightPhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (photoId: number) => api.delete(`/weight/photos/${photoId}`),
    onSuccess: () => {
      toast.add({ title: "Photo deleted", type: "success" });
      void queryClient.invalidateQueries({ queryKey: weightEntriesQueryKey });
    },
    onError: (error) => {
      toast.add({
        title: "Could not delete photo",
        description: error.message,
        type: "error",
      });
    },
  });
};
