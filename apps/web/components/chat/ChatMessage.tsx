"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Search,
  Brain,
  Layers,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type {
  ChatMessage as ChatMessageType,
  ThinkingStep,
} from "@deep-research/types";
import { toast } from "sonner";
import { FileAttachmentList } from "@/components/FileAttachment";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  const getThinkingIcon = (type: ThinkingStep["type"]) => {
    switch (type) {
      case "query":
        return <Search className="h-4 w-4" />;
      case "search":
        return <Search className="h-4 w-4" />;
      case "analysis":
        return <Brain className="h-4 w-4" />;
      case "depth":
      case "breadth":
        return <Layers className="h-4 w-4" />;
      case "completion":
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const formatThinkingTitle = (step: ThinkingStep) => {
    if (step.data?.query) {
      return `Searching: ${step.data.query}`;
    }
    return step.title;
  };

  if (message.role === "user") {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[80%] space-y-2">
          {/* File attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex justify-end">
              <FileAttachmentList
                files={message.attachments}
                showRemove={false}
              />
            </div>
          )}
          {/* Message content */}
          {message.content && (
            <div className="rounded-2xl bg-primary text-primary-foreground px-4 py-3">
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6">
      <div className="max-w-[90%] space-y-3">
        {/* Thinking traces */}
        {message.thinking && message.thinking.length > 0 && (
          <Card className="border-muted">
            <button
              onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-lg"
            >
              <div className="flex items-center gap-2">
                {message.isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Brain className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium text-muted-foreground">
                  {message.isStreaming
                    ? message.mode === "chat"
                      ? "Thinking..."
                      : "Researching..."
                    : message.mode === "chat"
                      ? "Thought process"
                      : "Research process"}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {message.thinking.length} steps
                </Badge>
              </div>
              {isThinkingExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {isThinkingExpanded && (
              <div className="px-4 pb-4 space-y-2 border-t">
                {message.thinking.map((step, index) => (
                  <div
                    key={step.id}
                    className="flex items-start gap-3 py-2 text-sm"
                  >
                    <div className="mt-0.5 text-muted-foreground">
                      {getThinkingIcon(step.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">{formatThinkingTitle(step)}</p>
                      {step.description && (
                        <p className="text-muted-foreground text-xs">
                          {step.description}
                        </p>
                      )}
                      {step.data?.progress !== undefined && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${step.data.progress}%` }}
                            />
                          </div>
                          <span>{Math.round(step.data.progress)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* File attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mb-2">
            <FileAttachmentList
              files={message.attachments}
              showRemove={false}
            />
          </div>
        )}

        {/* Message content */}
        {message.content && (
          <div className="rounded-2xl bg-muted px-4 py-3 relative group">
            {/* Copy button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(message.content)}
              className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="sr-only">Copy</span>
            </Button>

            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Customize code blocks
                  code: ({ node, className, children, ...props }: any) => {
                    const inline = !className;
                    if (inline) {
                      return (
                        <code
                          className="bg-muted-foreground/20 px-1 py-0.5 rounded text-sm"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                  // Customize links
                  a: ({ node, children, href, ...props }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                      {...props}
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>

            {/* Metadata */}
            {message.metadata && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
                {message.metadata.learningsCount !== undefined && (
                  <Badge variant="outline" className="text-xs">
                    {message.metadata.learningsCount} learnings
                  </Badge>
                )}
                {message.metadata.sourcesCount !== undefined && (
                  <Badge variant="outline" className="text-xs">
                    {message.metadata.sourcesCount} sources
                  </Badge>
                )}
                {message.metadata.duration !== undefined && (
                  <Badge variant="outline" className="text-xs">
                    {Math.round(message.metadata.duration / 1000)}s
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}

        {/* Streaming indicator */}
        {message.isStreaming && !message.content && (
          <div className="rounded-2xl bg-muted px-4 py-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">
                {message.mode === "chat" ? "Thinking..." : "Researching..."}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
