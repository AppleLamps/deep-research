"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS, QUERY_KEYS } from "@/lib/constants";
import type { ResearchQuery } from "@deep-research/types";
import { toast } from "sonner";

interface ResearchResponse {
  sessionId: string;
  status: "pending" | "running" | "completed" | "error";
}

interface UseResearchOptions {
  onSuccess?: (data: ResearchResponse) => void;
  onError?: (error: Error) => void;
  customGptId?: string | null;
}

export function useResearch(options?: UseResearchOptions) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (query: ResearchQuery): Promise<ResearchResponse> => {
      // Add LLM config from localStorage if available
      const provider = localStorage.getItem("llm_provider");
      const model = localStorage.getItem("llm_model");

      const queryWithConfig: ResearchQuery = {
        ...query,
        llmConfig: (provider || model) ? {
          provider: provider as any,
          model: model || undefined,
        } : undefined,
        customGptId: options?.customGptId || undefined,
      };

      const response = await apiClient.post<ResearchResponse>(
        API_ENDPOINTS.RESEARCH,
        queryWithConfig
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RESEARCH });
      toast.success("Research started successfully");
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to start research");
      options?.onError?.(error);
    },
    retry: 1,
    retryDelay: 1000,
  });

  return {
    startResearch: mutation.mutate,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}

