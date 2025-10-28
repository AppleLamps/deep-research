"use client";

import { APP_NAME } from "@/lib/constants";
import { ThemeToggle } from "./ThemeToggle";
import { ModelSelector } from "./ModelSelector";
import { ModeToggle } from "./ModeToggle";
import { CustomGPTSelector } from "./CustomGPTSelector";
import { Menu, Download, PenSquare } from "lucide-react";
import { Button } from "./ui/button";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import type { ChatMode } from "@deep-research/types";

interface HeaderProps {
  onMenuClick?: () => void;
  onSidebarToggle?: () => void;
  onNewChat?: () => void;
  showNewChat?: boolean;
  mode?: ChatMode;
  onModeChange?: (mode: ChatMode) => void;
  disableModeToggle?: boolean;
}

export function Header({
  onMenuClick,
  onSidebarToggle,
  onNewChat,
  showNewChat = false,
  mode = "research",
  onModeChange,
  disableModeToggle = false,
}: HeaderProps) {
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/80">
      <div className="flex h-14 items-center justify-between px-4 max-w-full">
        <div className="flex items-center gap-3">
          {onSidebarToggle && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={onSidebarToggle}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          )}
          {onMenuClick && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9"
              onClick={onMenuClick}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          )}
          <h1 className="text-lg font-semibold tracking-tight">{APP_NAME}</h1>
          {onModeChange && (
            <div className="hidden md:block">
              <ModeToggle
                mode={mode}
                onModeChange={onModeChange}
                disabled={disableModeToggle}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {showNewChat && onNewChat && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onNewChat}
              className="gap-2 h-9 rounded-lg"
            >
              <PenSquare className="h-4 w-4" />
              <span className="hidden sm:inline">New chat</span>
            </Button>
          )}
          <CustomGPTSelector mode={mode} />
          <ModelSelector />
          {isInstallable && !isInstalled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={promptInstall}
              className="hidden md:flex gap-2 h-9 rounded-lg"
            >
              <Download className="h-4 w-4" />
              <span>Install</span>
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
