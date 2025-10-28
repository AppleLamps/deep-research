"use client";

import { useState, useEffect } from "react";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { Header } from "@/components/Header";
import { ChatSidebar } from "@/components/ChatSidebar";
import { useChat } from "@/hooks/useChat";
import { useSimpleChat } from "@/hooks/useSimpleChat";
import { useActiveCustomGPT } from "@/hooks/useCustomGPTs";
import { useChatSessions } from "@/hooks/useChatSessions";
import type { ChatMode } from "@deep-research/types";

export default function ResearchPage() {
  const [mode, setMode] = useState<ChatMode>("chat");
  const { activeCustomGPT } = useActiveCustomGPT(mode);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Chat sessions management
  const {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    createSession,
    deleteSession,
    updateSessionMessages,
    getSession,
  } = useChatSessions();

  // Research mode hooks
  const {
    messages: researchMessages,
    sendMessage: sendResearchMessage,
    cancelResearch,
    clearMessages: clearResearchMessages,
    loadMessages: loadResearchMessages,
    isLoading: isResearchLoading
  } = useChat({
    customGptId: activeCustomGPT?.id || null,
  });

  // Chat mode hooks
  const {
    messages: chatMessages,
    sendMessage: sendChatMessage,
    cancelMessage: cancelChat,
    clearMessages: clearChatMessages,
    loadMessages: loadChatMessages,
    isLoading: isChatLoading,
  } = useSimpleChat({
    customGptId: activeCustomGPT?.id || null,
  });

  // Use the appropriate state based on mode
  const messages = mode === "research" ? researchMessages : chatMessages;
  const isLoading = mode === "research" ? isResearchLoading : isChatLoading;

  // Sync messages with current session
  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      updateSessionMessages(currentSessionId, messages);
    }
  }, [messages, currentSessionId, updateSessionMessages]);

  const handleSubmit = (
    query: string,
    breadth: number,
    depth: number,
    attachments?: import("@deep-research/types").FileAttachment[],
  ) => {
    // Create a new session if none exists
    if (!currentSessionId) {
      createSession(mode);
    }

    if (mode === "research") {
      sendResearchMessage(query, breadth, depth);
    } else {
      sendChatMessage(query, attachments);
    }
  };

  const handleExampleClick = (query: string) => {
    // Create a new session if none exists
    if (!currentSessionId) {
      createSession(mode);
    }

    if (mode === "research") {
      // Use default breadth and depth for examples
      sendResearchMessage(query, 5, 3);
    } else {
      sendChatMessage(query);
    }
  };

  const handleCancel = () => {
    if (mode === "research") {
      cancelResearch();
    } else {
      cancelChat();
    }
  };

  const handleNewChat = () => {
    if (isLoading) {
      handleCancel();
    }
    if (mode === "research") {
      clearResearchMessages();
    } else {
      clearChatMessages();
    }
    // Create a new session
    createSession(mode);
  };

  const handleModeChange = (newMode: ChatMode) => {
    if (isLoading) {
      // Don't allow mode change while loading
      return;
    }
    setMode(newMode);
  };

  const handleSessionSelect = (sessionId: string) => {
    const session = getSession(sessionId);
    if (!session) return;

    setCurrentSessionId(sessionId);
    setMode(session.mode);

    // Load the session's messages into the appropriate hook
    if (session.mode === "research") {
      loadResearchMessages(session.messages);
    } else {
      loadChatMessages(session.messages);
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteSession(sessionId);
    // If we deleted the current session, clear messages
    if (sessionId === currentSessionId) {
      if (mode === "research") {
        clearResearchMessages();
      } else {
        clearChatMessages();
      }
    }
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex min-h-screen">
      {/* Chat Sidebar */}
      <div className={`fixed left-0 top-0 h-full z-40 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <ChatSidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSessionSelect={handleSessionSelect}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
        />
      </div>

      {/* Main content */}
      <div className={`flex-1 flex flex-col ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Header
          showNewChat={messages.length > 0}
          onNewChat={handleNewChat}
          mode={mode}
          onModeChange={handleModeChange}
          disableModeToggle={isLoading}
        />

        <ChatContainer
          messages={messages}
          isLoading={isLoading}
          onExampleClick={handleExampleClick}
        />
        <div className="pb-6 pt-4">
          <div className="container max-w-3xl mx-auto px-4">
            {/* Mobile mode toggle */}
            <div className="md:hidden mb-4 flex justify-center">
              <div className="inline-flex items-center rounded-lg border bg-background p-1">
                <button
                  onClick={() => handleModeChange("chat")}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === "chat"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => handleModeChange("research")}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === "research"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Deep Research
                </button>
              </div>
            </div>
          </div>
        </div>
        <ChatInput
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onCancel={isLoading ? handleCancel : undefined}
          showResearchSettings={mode === "research"}
        />
      </div>
    </div>
  );
}

