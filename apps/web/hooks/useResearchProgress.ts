"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { API_URL } from "@/lib/constants";
import type { ResearchProgress } from "@deep-research/types";
import { toast } from "sonner";

interface UseResearchProgressOptions {
  sessionId: string | null;
  onComplete?: (progress: ResearchProgress) => void;
  onError?: (error: Error) => void;
}

export function useResearchProgress({
  sessionId,
  onComplete,
  onError,
}: UseResearchProgressOptions) {
  const [progress, setProgress] = useState<ResearchProgress | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const completedRef = useRef(false);
  const maxReconnectAttempts = 5;

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const connect = useCallback(() => {
    if (!sessionId) {
      cleanup();
      return;
    }

    cleanup();

    try {
      const eventSource = new EventSource(`${API_URL}/progress/${sessionId}`);

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data: ResearchProgress = JSON.parse(event.data);
          setProgress(data);

          if (data.status === "completed") {
            completedRef.current = true;
            onComplete?.(data);
            cleanup();
          } else if (data.status === "error") {
            completedRef.current = true;
            const err = new Error(data.message || "Research failed");
            setError(err);
            onError?.(err);
            cleanup();
          }
        } catch (err) {
          console.error("Failed to parse progress data:", err);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);

        // Don't reconnect if research completed or errored
        if (completedRef.current) {
          cleanup();
          return;
        }

        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            10000,
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          const err = new Error("Failed to connect to progress stream");
          setError(err);
          onError?.(err);
          toast.error("Lost connection to research progress");
          cleanup();
        }
      };

      eventSourceRef.current = eventSource;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to connect");
      setError(error);
      onError?.(error);
    }
  }, [sessionId, onComplete, onError, cleanup]);

  useEffect(() => {
    connect();
    return cleanup;
  }, [connect, cleanup]);

  const cancel = useCallback(() => {
    completedRef.current = true; // Mark as completed to prevent reconnection
    cleanup();
    setProgress(null);
    setError(null);
  }, [cleanup]);

  return {
    progress,
    isConnected,
    error,
    cancel,
    reconnect: connect,
  };
}
