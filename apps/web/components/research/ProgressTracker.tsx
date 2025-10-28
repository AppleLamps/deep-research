"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import type { ResearchProgress } from "@deep-research/types";

interface ProgressTrackerProps {
  progress: ResearchProgress;
  onCancel?: () => void;
}

export function ProgressTracker({ progress, onCancel }: ProgressTrackerProps) {
  const getStatusColor = (status: ResearchProgress["status"]) => {
    switch (status) {
      case "running":
        return "default";
      case "completed":
        return "secondary";
      case "error":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusText = (status: ResearchProgress["status"]) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "running":
        return "Running";
      case "completed":
        return "Completed";
      case "error":
        return "Error";
      default:
        return "Unknown";
    }
  };

  const estimatedTimeRemaining = () => {
    if (progress.status !== "running" || progress.progress === 0) return null;

    const totalQueries = progress.totalQueries;
    const completedQueries = progress.completedQueries;
    const remainingQueries = totalQueries - completedQueries;

    const avgTimePerQuery = 10;
    const estimatedSeconds = remainingQueries * avgTimePerQuery;

    if (estimatedSeconds < 60) {
      return `~${estimatedSeconds}s remaining`;
    } else {
      const minutes = Math.ceil(estimatedSeconds / 60);
      return `~${minutes}m remaining`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              Research Progress
              {progress.status === "running" && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
            </CardTitle>
            <CardDescription>
              Session: {progress.sessionId.slice(0, 8)}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusColor(progress.status)}>
              {getStatusText(progress.status)}
            </Badge>
            {onCancel && progress.status === "running" && (
              <Button variant="ghost" size="icon" onClick={onCancel}>
                <X className="h-4 w-4" />
                <span className="sr-only">Cancel research</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">
              {Math.round(progress.progress)}%
            </span>
          </div>
          <Progress value={progress.progress} className="h-2" />
          {estimatedTimeRemaining() && (
            <p className="text-xs text-muted-foreground text-right">
              {estimatedTimeRemaining()}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Depth</p>
            <p className="text-2xl font-semibold">
              {progress.currentDepth}/{progress.totalDepth}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Breadth</p>
            <p className="text-2xl font-semibold">
              {progress.currentBreadth}/{progress.totalBreadth}
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Queries Completed</p>
          <p className="text-lg font-medium">
            {progress.completedQueries} / {progress.totalQueries}
          </p>
        </div>

        {progress.currentQuery && (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Current Query</p>
            <p className="text-sm font-medium line-clamp-2">
              {progress.currentQuery}
            </p>
          </div>
        )}

        {progress.message && (
          <div className="rounded-md bg-muted p-3">
            <p className="text-sm">{progress.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
