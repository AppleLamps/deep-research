"use client";

import { MessageSquare, Search } from "lucide-react";
import { Button } from "./ui/button";
import type { ChatMode } from "@deep-research/types";

interface ModeToggleProps {
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  disabled?: boolean;
}

export function ModeToggle({ mode, onModeChange, disabled }: ModeToggleProps) {
  return (
    <div className="inline-flex items-center rounded-lg border bg-background p-1">
      <Button
        variant={mode === "chat" ? "default" : "ghost"}
        size="sm"
        onClick={() => onModeChange("chat")}
        disabled={disabled}
        className="gap-2 h-8 rounded-md"
      >
        <MessageSquare className="h-4 w-4" />
        <span className="hidden sm:inline">Chat</span>
      </Button>
      <Button
        variant={mode === "research" ? "default" : "ghost"}
        size="sm"
        onClick={() => onModeChange("research")}
        disabled={disabled}
        className="gap-2 h-8 rounded-md"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Deep Research</span>
      </Button>
    </div>
  );
}
