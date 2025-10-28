"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import type { ChatMessage as ChatMessageType } from "@deep-research/types";

interface ChatContainerProps {
  messages: ChatMessageType[];
  isLoading?: boolean;
  onExampleClick?: (query: string) => void;
}

export function ChatContainer({
  messages,
  isLoading,
  onExampleClick,
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const exampleQueries = [
    "What are the latest developments in quantum computing and their potential applications?",
    "How is AI being used in healthcare and what are the ethical considerations?",
    "What are the most promising renewable energy technologies for the next decade?",
  ];

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-2xl">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Deep Research Assistant</h2>
            <p className="text-muted-foreground">
              Ask me anything and I'll perform deep research to find
              comprehensive answers.
            </p>
          </div>

          <div className="grid gap-3 mt-8">
            <div className="text-left">
              <h3 className="text-sm font-medium mb-2">Example queries:</h3>
              <div className="space-y-2">
                {exampleQueries.map((query, index) => (
                  <button
                    key={index}
                    onClick={() => onExampleClick?.(query)}
                    className="w-full p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left"
                  >
                    <p className="text-sm">{query}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
