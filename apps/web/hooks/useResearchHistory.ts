"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { QUERY_KEYS } from "@/lib/constants";
import type { ResearchResult } from "@deep-research/types";
import { toast } from "sonner";

export function useResearchHistory() {
  const queryClient = useQueryClient();

  const {
    data: history = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ResearchResult[]>({
    queryKey: QUERY_KEYS.RESEARCH,
    queryFn: async () => {
      try {
        const response = await apiClient.get<ResearchResult[]>("/history");
        return response.data;
      } catch (err) {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const deleteHistoryItem = useMutation({
    mutationFn: async (sessionId: string) => {
      await apiClient.delete(`/history/${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RESEARCH });
      toast.success("History item deleted");
    },
    onError: () => {
      toast.error("Failed to delete history item");
    },
    retry: 1,
  });

  const clearHistory = useMutation({
    mutationFn: async () => {
      await apiClient.delete("/history");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RESEARCH });
      toast.success("History cleared");
    },
    onError: () => {
      toast.error("Failed to clear history");
    },
    retry: 1,
  });

  return {
    history,
    isLoading,
    isError,
    error,
    refetch,
    deleteItem: deleteHistoryItem.mutate,
    isDeletingItem: deleteHistoryItem.isPending,
    clearAll: clearHistory.mutate,
    isClearingAll: clearHistory.isPending,
  };
}
