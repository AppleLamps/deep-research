"use client";

import { useState, useCallback, useEffect } from "react";
import { useResearch } from "./useResearch";
import { useResearchProgress } from "./useResearchProgress";
import { apiClient } from "@/lib/api-client";
import type {
  ChatMessage,
  ResearchQuery,
  ResearchProgress,
  ResearchResult,
} from "@deep-research/types";

interface UseChatOptions {
  customGptId?: string | null;
}

export function useChat(options?: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const { startResearch, isLoading: isStarting } = useResearch({
    onSuccess: (data) => {
      setCurrentSessionId(data.sessionId);
    },
    customGptId: options?.customGptId || null,
  });

  const { progress, cancel } = useResearchProgress({
    sessionId: currentSessionId,
    onComplete: async (finalProgress) => {
      // Fetch the final result
      try {
        const response = await apiClient.get<ResearchResult>(
          `/session/${finalProgress.sessionId}`,
        );
        const result = response.data;

        // Update the assistant message with the final report
        setMessages((prev) => {
          const lastIndex = prev.length - 1;
          if (lastIndex < 0) return prev;

          const lastMessage = prev[lastIndex];
          if (!lastMessage || lastMessage.role !== "assistant") return prev;

          return [
            ...prev.slice(0, lastIndex),
            {
              ...lastMessage,
              content: result.report || result.answer || "Research completed.",
              isStreaming: false,
              metadata: {
                breadth: result.learnings.length,
                depth: finalProgress.totalDepth,
                duration: result.duration,
                learningsCount: result.learnings.length,
                sourcesCount: result.visitedUrls.length,
              },
            },
          ];
        });
      } catch (error) {
        console.error("Failed to fetch final result:", error);

        // Update message with error
        setMessages((prev) => {
          const lastIndex = prev.length - 1;
          if (lastIndex < 0) return prev;

          const lastMessage = prev[lastIndex];
          if (!lastMessage || lastMessage.role !== "assistant") return prev;

          return [
            ...prev.slice(0, lastIndex),
            {
              ...lastMessage,
              content: "Sorry, there was an error completing the research.",
              isStreaming: false,
            },
          ];
        });
      }

      setCurrentSessionId(null);
    },
  });

  // Convert progress updates to thinking steps
  const updateThinkingSteps = useCallback((progress: ResearchProgress) => {
    if (!progress.sessionId) return;

    setMessages((prev) => {
      const lastIndex = prev.length - 1;
      if (lastIndex < 0) return prev;

      const lastMessage = prev[lastIndex];
      if (
        !lastMessage ||
        lastMessage.role !== "assistant" ||
        lastMessage.sessionId !== progress.sessionId
      ) {
        return prev;
      }

      const steps = lastMessage.thinking || [];
      let updatedSteps = [...steps];

      // Add or update query step
      if (progress.currentQuery) {
        const queryStepIndex = updatedSteps.findIndex(
          (s) => s.type === "query" && s.data?.query === progress.currentQuery,
        );

        if (queryStepIndex === -1) {
          // Add new query step
          updatedSteps.push({
            id: `${progress.sessionId}-query-${updatedSteps.length}`,
            type: "query",
            title: "Searching",
            description: progress.currentQuery,
            timestamp: Date.now(),
            data: {
              query: progress.currentQuery,
              progress: progress.progress,
              completedQueries: progress.completedQueries,
              totalQueries: progress.totalQueries,
            },
          });
        } else {
          // Update existing query step
          updatedSteps[queryStepIndex] = {
            ...updatedSteps[queryStepIndex],
            data: {
              ...updatedSteps[queryStepIndex].data,
              progress: progress.progress,
              completedQueries: progress.completedQueries,
              totalQueries: progress.totalQueries,
            },
          };
        }
      }

      // Add depth level step
      if (progress.currentDepth > 0) {
        const depthStepIndex = updatedSteps.findIndex(
          (s) => s.type === "depth" && s.data?.depth === progress.currentDepth,
        );

        if (depthStepIndex === -1) {
          updatedSteps.push({
            id: `${progress.sessionId}-depth-${progress.currentDepth}`,
            type: "depth",
            title: `Depth level ${progress.currentDepth}/${progress.totalDepth}`,
            description: `Exploring ${progress.currentBreadth} sources at this level`,
            timestamp: Date.now(),
            data: {
              depth: progress.currentDepth,
              breadth: progress.currentBreadth,
              progress: progress.progress,
            },
          });
        }
      }

      // Add completion step when done
      if (
        progress.status === "completed" &&
        !updatedSteps.find((s) => s.type === "completion")
      ) {
        updatedSteps.push({
          id: `${progress.sessionId}-completion`,
          type: "completion",
          title: "Research completed",
          description: `Analyzed ${progress.completedQueries} sources across ${progress.totalDepth} depth levels`,
          timestamp: Date.now(),
          data: {
            completedQueries: progress.completedQueries,
            totalQueries: progress.totalQueries,
            progress: 100,
          },
        });
      }

      return [
        ...prev.slice(0, lastIndex),
        {
          ...lastMessage,
          thinking: updatedSteps,
          sessionId: progress.sessionId,
        },
      ];
    });
  }, []);

  // Handle progress updates with useEffect to avoid infinite re-renders
  useEffect(() => {
    if (progress) {
      updateThinkingSteps(progress);
    }
  }, [progress, updateThinkingSteps]);

  const sendMessage = useCallback(
    (query: string, breadth: number, depth: number) => {
      // Add user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: query,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // Add assistant message placeholder
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        thinking: [],
        isStreaming: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Start research
      const researchQuery: ResearchQuery = {
        query,
        breadth,
        depth,
      };

      startResearch(researchQuery);
    },
    [startResearch],
  );

  const cancelResearch = useCallback(() => {
    cancel();

    // Update the last message to show cancellation
    setMessages((prev) => {
      const lastIndex = prev.length - 1;
      if (lastIndex < 0) return prev;

      const lastMessage = prev[lastIndex];
      if (
        !lastMessage ||
        lastMessage.role !== "assistant" ||
        !lastMessage.isStreaming
      ) {
        return prev;
      }

      return [
        ...prev.slice(0, lastIndex),
        {
          ...lastMessage,
          content: "Research cancelled.",
          isStreaming: false,
        },
      ];
    });

    setCurrentSessionId(null);
  }, [cancel]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentSessionId(null);
  }, []);

  const loadMessages = useCallback((loadedMessages: ChatMessage[]) => {
    setMessages(loadedMessages);
  }, []);

  return {
    messages,
    sendMessage,
    cancelResearch,
    clearMessages,
    loadMessages,
    isLoading: isStarting || progress?.status === "running",
  };
}
