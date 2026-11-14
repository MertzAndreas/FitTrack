import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import type { Block, Food } from "./food";
import type { DraftFoodItem } from "./SearchFoods";

export const dayBlockQueryKey = "blocks" as const;
const foodSearch = "food-search" as const;

export const useDayBlocks = (dateKey: string) =>
  useQuery({
    queryKey: [dayBlockQueryKey, dateKey],
    queryFn: async ({ signal }) => {
      const blocks = await api.get<Block[]>(`/food-log/${dateKey}`, { signal });
      return blocks.sort((a, b) => a.sortOrder - b.sortOrder);
    },
  });

export const useSearchFood = (query: string) =>
  useQuery({
    queryKey: [foodSearch, query],
    enabled: query.trim().length > 0,
    queryFn: async ({ signal }) =>
      api.get<Food[]>("/foods/search", {
        signal,
        params: { q: query.trim(), limit: 5 },
      }),
  });

export const useSubmitFoodEntries = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      blockId,
      foodEntries,
    }: {
      blockId: number;
      foodEntries: DraftFoodItem[];
      dateKey: string;
    }) => {
      const entries = foodEntries.map((entry) => ({
        foodId: entry.food.id,
        quantity: entry.quantity,
      }));
      return api.post<void>(`/food-log/blocks/${blockId}/entries`, entries);
    },
    onSuccess: (_, { dateKey }) => {
      toast.add({ title: "Food added", type: "success" });
      void queryClient.invalidateQueries({
        queryKey: [dayBlockQueryKey, dateKey],
      });
    },
    onError: (error) => {
      toast.add({
        title: "Could not add food",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
        type: "error",
      });
    },
  });
};

export const useDeleteFoodEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entryId }: { entryId: number; dateKey: string }) =>
      api.delete(`/food-log/entries/${entryId}`),
    onSuccess: (_, { dateKey }) => {
      void queryClient.invalidateQueries({
        queryKey: [dayBlockQueryKey, dateKey],
      });
    },
    onError: (error) => {
      toast.add({
        title: "Could not delete food entry",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
        type: "error",
      });
    },
  });
};

export const useCopyBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sourceId,
      destinationId,
    }: {
      sourceId: number;
      destinationId: number;
    }) => api.post<void>(`/food-log/blocks/${sourceId}/${destinationId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [dayBlockQueryKey] });
    },
    onError: (error) => {
      toast.add({
        title: "Could not copy meal",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
        type: "error",
      });
    },
  });
};

export const useCopyDay = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sourceDate,
      destinationDate,
    }: {
      sourceDate: string;
      destinationDate: string;
    }) =>
      api.post<{ copiedEntries: number }>(
        `/food-log/days/${sourceDate}/${destinationDate}/copy`,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [dayBlockQueryKey] });
    },
    onError: (error) => {
      toast.add({
        title: "Could not copy day",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
        type: "error",
      });
    },
  });
};
