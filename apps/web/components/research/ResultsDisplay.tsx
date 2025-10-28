"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, Share2, ExternalLink, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ResearchResult } from "@deep-research/types";
import { toast } from "sonner";

interface ResultsDisplayProps {
  result: ResearchResult;
}

export function ResultsDisplay({ result }: ResultsDisplayProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);

  const copyToClipboard = async (text: string, index?: number) => {
    try {
      await navigator.clipboard.writeText(text);
      if (index !== undefined) {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      } else {
        setCopiedReport(true);
        setTimeout(() => setCopiedReport(false), 2000);
      }
      toast.success("Copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const downloadMarkdown = () => {
    const content = `# ${result.query}\n\n## Learnings\n\n${result.learnings.map((l, i) => `${i + 1}. ${l}`).join("\n")}\n\n## Sources\n\n${result.visitedUrls.map((url, i) => `${i + 1}. ${url}`).join("\n")}\n\n## Report\n\n${result.report || result.answer || "No report available"}`;

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `research-${result.sessionId.slice(0, 8)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Downloaded as Markdown");
  };

  const shareResults = async () => {
    const shareData = {
      title: `Research: ${result.query}`,
      text: `Found ${result.learnings.length} learnings from ${result.visitedUrls.length} sources`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success("Shared successfully");
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          toast.error("Failed to share");
        }
      }
    } else {
      copyToClipboard(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle>Research Results</CardTitle>
            <CardDescription className="line-clamp-2">
              {result.query}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={downloadMarkdown}>
              <Download className="h-4 w-4" />
              <span className="sr-only">Download</span>
            </Button>
            <Button variant="outline" size="icon" onClick={shareResults}>
              <Share2 className="h-4 w-4" />
              <span className="sr-only">Share</span>
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant="secondary">{result.learnings.length} learnings</Badge>
          <Badge variant="secondary">{result.visitedUrls.length} sources</Badge>
          <Badge variant="secondary">{formatDuration(result.duration)}</Badge>
          {result.success ? (
            <Badge variant="default">Success</Badge>
          ) : (
            <Badge variant="destructive">Failed</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="learnings" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="learnings">Learnings</TabsTrigger>
            <TabsTrigger value="sources">Sources</TabsTrigger>
            <TabsTrigger value="report">Report</TabsTrigger>
          </TabsList>

          <TabsContent value="learnings" className="space-y-4">
            {result.learnings.length > 0 ? (
              <div className="space-y-2">
                {result.learnings.map((learning, index) => (
                  <div
                    key={index}
                    className="group flex items-start gap-2 rounded-lg border p-3 hover:bg-muted/50"
                  >
                    <span className="flex-shrink-0 font-semibold text-muted-foreground">
                      {index + 1}.
                    </span>
                    <p className="flex-1 text-sm">{learning}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100"
                      onClick={() => copyToClipboard(learning, index)}
                    >
                      {copiedIndex === index ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      <span className="sr-only">Copy</span>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No learnings found
              </p>
            )}
          </TabsContent>

          <TabsContent value="sources" className="space-y-4">
            {result.visitedUrls.length > 0 ? (
              <div className="space-y-2">
                {result.visitedUrls.map((url, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded-lg border p-3 hover:bg-muted/50"
                  >
                    <span className="flex-shrink-0 font-semibold text-muted-foreground">
                      {index + 1}.
                    </span>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-sm text-primary hover:underline truncate"
                    >
                      {url}
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0"
                      asChild
                    >
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        <span className="sr-only">Open link</span>
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No sources found
              </p>
            )}
          </TabsContent>

          <TabsContent value="report" className="space-y-4">
            {result.report || result.answer ? (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(result.report || result.answer || "")
                    }
                  >
                    {copiedReport ? (
                      <>
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Report
                      </>
                    )}
                  </Button>
                </div>
                <div className="prose prose-neutral dark:prose-invert max-w-none rounded-lg border p-6">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {result.report || result.answer || ""}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No report available
              </p>
            )}
          </TabsContent>
        </Tabs>

        {result.error && (
          <div className="mt-4 rounded-lg border border-destructive bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{result.error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
