"use client";

import { useState, useEffect } from "react";
import type { ChatMessage } from "@deep-research/types";

export interface ChatSession {
  id: string;
  title: string;
  mode: "chat" | "research";
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "chat-sessions";
const MAX_SESSIONS = 50;

export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Load sessions from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSessions(parsed);
      }
    } catch (error) {
      console.error("Failed to load chat sessions:", error);
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error("Failed to save chat sessions:", error);
    }
  }, [sessions]);

  const createSession = (mode: "chat" | "research" = "chat"): string => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: "New Chat",
      mode,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setSessions((prev) => {
      const updated = [newSession, ...prev];
      // Keep only the most recent sessions
      return updated.slice(0, MAX_SESSIONS);
    });

    setCurrentSessionId(newSession.id);
    return newSession.id;
  };

  const updateSession = (
    sessionId: string,
    updates: Partial<Omit<ChatSession, "id" | "createdAt">>,
  ) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? { ...session, ...updates, updatedAt: Date.now() }
          : session,
      ),
    );
  };

  const deleteSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
    }
  };

  const getSession = (sessionId: string): ChatSession | undefined => {
    return sessions.find((s) => s.id === sessionId);
  };

  const getCurrentSession = (): ChatSession | undefined => {
    if (!currentSessionId) return undefined;
    return getSession(currentSessionId);
  };

  const addMessageToSession = (sessionId: string, message: ChatMessage) => {
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id === sessionId) {
          const updatedMessages = [...session.messages, message];

          // Auto-generate title from first user message
          let title = session.title;
          if (
            title === "New Chat" &&
            message.role === "user" &&
            message.content
          ) {
            title =
              message.content.slice(0, 50) +
              (message.content.length > 50 ? "..." : "");
          }

          return {
            ...session,
            messages: updatedMessages,
            title,
            updatedAt: Date.now(),
          };
        }
        return session;
      }),
    );
  };

  const updateSessionMessages = (
    sessionId: string,
    messages: ChatMessage[],
  ) => {
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id === sessionId) {
          // Auto-generate title from first user message if still "New Chat"
          let title = session.title;
          if (title === "New Chat") {
            const firstUserMessage = messages.find((m) => m.role === "user");
            if (firstUserMessage?.content) {
              title =
                firstUserMessage.content.slice(0, 50) +
                (firstUserMessage.content.length > 50 ? "..." : "");
            }
          }

          return {
            ...session,
            messages,
            title,
            updatedAt: Date.now(),
          };
        }
        return session;
      }),
    );
  };

  const clearAllSessions = () => {
    setSessions([]);
    setCurrentSessionId(null);
  };

  return {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    createSession,
    updateSession,
    deleteSession,
    getSession,
    getCurrentSession,
    addMessageToSession,
    updateSessionMessages,
    clearAllSessions,
  };
}
