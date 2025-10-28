"use client";

import { useState } from "react";
import { useCustomGPTs, useActiveCustomGPT } from "@/hooks/useCustomGPTs";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ChevronDown, Sparkles, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ChatMode } from "@deep-research/types";

interface CustomGPTSelectorProps {
  mode: ChatMode;
}

export function CustomGPTSelector({ mode }: CustomGPTSelectorProps) {
  const router = useRouter();
  const { customGPTs, loading } = useCustomGPTs();
  const { activeCustomGPT, setActiveCustomGPT } = useActiveCustomGPT(mode);

  const handleSelect = (customGptId: string | null) => {
    setActiveCustomGPT(customGptId);
  };

  const handleCreateNew = () => {
    router.push("/custom-gpts/new");
  };

  const handleManage = () => {
    router.push("/custom-gpts");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 h-9 rounded-lg"
          disabled={loading}
        >
          {activeCustomGPT ? (
            <>
              <span className="text-base">{activeCustomGPT.avatar || "🤖"}</span>
              <span className="hidden sm:inline max-w-[150px] truncate">
                {activeCustomGPT.name}
              </span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Custom GPT</span>
            </>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[250px]">
        <DropdownMenuLabel>Custom GPTs</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => handleSelect(null)}>
          <div className="flex items-center gap-2">
            <span className="text-base">✨</span>
            <div className="flex flex-col">
              <span className="font-medium">Default</span>
              <span className="text-xs text-muted-foreground">
                Standard AI assistant
              </span>
            </div>
          </div>
        </DropdownMenuItem>

        {customGPTs.length > 0 && (
          <>
            <DropdownMenuSeparator />
            {customGPTs.map((gpt) => (
              <DropdownMenuItem
                key={gpt.id}
                onClick={() => handleSelect(gpt.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{gpt.avatar || "🤖"}</span>
                  <div className="flex flex-col">
                    <span className="font-medium">{gpt.name}</span>
                    {gpt.description && (
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {gpt.description}
                      </span>
                    )}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}

        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleCreateNew}>
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Create new Custom GPT</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleManage}>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>Manage Custom GPTs</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

