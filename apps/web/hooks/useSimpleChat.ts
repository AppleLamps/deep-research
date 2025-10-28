"use client";

import { useState, useCallback, useRef } from "react";
import { API_URL, API_ENDPOINTS } from "@/lib/constants";
import type {
  ChatMessage,
  ChatMessageRole,
  FileAttachment,
} from "@deep-research/types";
import { toast } from "sonner";

interface UseSimpleChatOptions {
  onError?: (error: Error) => void;
  customGptId?: string | null;
}

export function useSimpleChat(options?: UseSimpleChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string, attachments?: FileAttachment[]) => {
      if (!content.trim() && (!attachments || attachments.length === 0)) return;

      // Add user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        timestamp: Date.now(),
        mode: "chat",
        attachments,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Create assistant message placeholder
      const assistantMessageId = `assistant-${Date.now()}`;
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isStreaming: true,
        mode: "chat",
      };

      setMessages((prev) => [...prev, assistantMessage]);

      try {
        // Get LLM config from localStorage
        const provider = localStorage.getItem("llm_provider");
        const model = localStorage.getItem("llm_model");

        // Prepare messages for API (role, content, and attachments)
        const apiMessages = [...messages, userMessage].map((msg) => ({
          role: msg.role as ChatMessageRole,
          content: msg.content,
          attachments: msg.attachments,
        }));

        // Create abort controller
        abortControllerRef.current = new AbortController();

        const response = await fetch(`${API_URL}${API_ENDPOINTS.CHAT}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: apiMessages,
            llmConfig:
              provider || model
                ? {
                  provider: provider || undefined,
                  model: model || undefined,
                }
                : undefined,
            customGptId: options?.customGptId || undefined,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("No response body");
        }

        let accumulatedContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === "text") {
                  accumulatedContent += data.content;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: accumulatedContent }
                        : msg,
                    ),
                  );
                } else if (data.type === "done") {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, isStreaming: false }
                        : msg,
                    ),
                  );
                } else if (data.type === "error") {
                  throw new Error(data.error);
                }
              } catch (parseError) {
                // Skip malformed JSON lines
                console.warn("Failed to parse SSE data:", line);
              }
            }
          }
        }
      } catch (error: any) {
        if (error.name === "AbortError") {
          // Request was cancelled
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                  ...msg,
                  content: msg.content + "\n\n[Cancelled]",
                  isStreaming: false,
                }
                : msg,
            ),
          );
        } else {
          console.error("Chat error:", error);
          toast.error(error.message || "Failed to send message");
          options?.onError?.(error);

          // Remove the failed assistant message
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== assistantMessageId),
          );
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [messages, options],
  );

  const cancelMessage = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const loadMessages = useCallback((loadedMessages: ChatMessage[]) => {
    setMessages(loadedMessages);
  }, []);

  return {
    messages,
    sendMessage,
    cancelMessage,
    clearMessages,
    loadMessages,
    isLoading,
  };
}
