"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ArrowUp, Sliders, X, Plus, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RESEARCH_LIMITS } from "@/lib/constants";
import { FileAttachmentList } from "@/components/FileAttachment";
import type { FileAttachment } from "@deep-research/types";
import { toast } from "sonner";

interface ChatInputProps {
  onSubmit: (
    query: string,
    breadth: number,
    depth: number,
    attachments?: FileAttachment[],
  ) => void;
  isLoading?: boolean;
  disabled?: boolean;
  onCancel?: () => void;
  showResearchSettings?: boolean;
}

export function ChatInput({
  onSubmit,
  isLoading = false,
  disabled = false,
  onCancel,
  showResearchSettings = true,
}: ChatInputProps) {
  const [query, setQuery] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [breadth, setBreadth] = useState<number>(
    RESEARCH_LIMITS.DEFAULT_BREADTH,
  );
  const [depth, setDepth] = useState<number>(RESEARCH_LIMITS.DEFAULT_DEPTH);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [query]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3051";
      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();

      if (data.files && data.files.length > 0) {
        setAttachments((prev) => [...prev, ...data.files]);
        toast.success(`${data.files.length} file(s) uploaded successfully`);
      }

      if (data.errors && data.errors.length > 0) {
        data.errors.forEach((error: string) => toast.error(error));
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload files");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAttachment = (fileId: string) => {
    setAttachments((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      (query.trim() || attachments.length > 0) &&
      !isLoading &&
      !disabled &&
      !isUploading
    ) {
      onSubmit(
        query.trim(),
        breadth,
        depth,
        attachments.length > 0 ? attachments : undefined,
      );
      setQuery("");
      setAttachments([]);
      setShowSettings(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="pb-6 pt-4">
      <div className="container max-w-3xl mx-auto px-4">
        {/* Settings Panel */}
        {showSettings && (
          <Card className="mb-4 shadow-lg">
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Research Settings</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="breadth" className="text-sm">
                      Breadth: {breadth}
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      Number of sources per level
                    </span>
                  </div>
                  <Slider
                    id="breadth"
                    min={RESEARCH_LIMITS.MIN_BREADTH}
                    max={RESEARCH_LIMITS.MAX_BREADTH}
                    step={1}
                    value={[breadth]}
                    onValueChange={(value) => setBreadth(value[0])}
                    disabled={isLoading || disabled}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="depth" className="text-sm">
                      Depth: {depth}
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      How many levels deep to research
                    </span>
                  </div>
                  <Slider
                    id="depth"
                    min={RESEARCH_LIMITS.MIN_DEPTH}
                    max={RESEARCH_LIMITS.MAX_DEPTH}
                    step={1}
                    value={[depth]}
                    onValueChange={(value) => setDepth(value[0])}
                    disabled={isLoading || disabled}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Floating Input Form */}
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative rounded-[26px] border bg-background shadow-lg hover:shadow-xl transition-shadow">
            {/* File attachments preview */}
            {attachments.length > 0 && (
              <div className="px-4 pt-3 pb-2 border-b">
                <FileAttachmentList
                  files={attachments}
                  onRemove={handleRemoveAttachment}
                  showRemove={!isLoading && !disabled}
                />
              </div>
            )}

            <div className="flex items-end gap-2 p-2">
              {/* Plus/Attach button */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/gif,image/webp,.pdf,.txt,.md,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isLoading || disabled || isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="h-10 w-10 shrink-0 rounded-full hover:bg-accent"
              >
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Plus className="h-5 w-5" />
                )}
                <span className="sr-only">Attach files</span>
              </Button>

              {/* Textarea */}
              <div className="flex-1 min-h-[40px] max-h-[200px] overflow-y-auto">
                <Textarea
                  ref={textareaRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything..."
                  disabled={isLoading || disabled}
                  className="min-h-[40px] max-h-[200px] resize-none border-0 bg-transparent px-0 py-2.5 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
                  rows={1}
                />
              </div>

              {/* Settings button - only show in research mode */}
              {showResearchSettings && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(!showSettings)}
                  disabled={isLoading || disabled}
                  className="h-10 w-10 shrink-0 rounded-full hover:bg-accent"
                >
                  <Sliders className="h-5 w-5" />
                  <span className="sr-only">Settings</span>
                </Button>
              )}

              {/* Send/Cancel button */}
              {isLoading && onCancel ? (
                <Button
                  type="button"
                  size="icon"
                  onClick={onCancel}
                  variant="ghost"
                  className="h-10 w-10 shrink-0 rounded-full hover:bg-accent"
                >
                  <X className="h-5 w-5" />
                  <span className="sr-only">Cancel</span>
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  disabled={
                    (!query.trim() && attachments.length === 0) ||
                    isLoading ||
                    disabled ||
                    isUploading
                  }
                  className="h-10 w-10 shrink-0 rounded-full"
                >
                  <ArrowUp className="h-5 w-5" />
                  <span className="sr-only">Send</span>
                </Button>
              )}
            </div>
          </div>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-3">
          Deep Research can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
}
