"use client";

import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FormSkeleton } from "@/components/SkeletonLoader";
import { useResearchHistory } from "@/hooks/useResearchHistory";
import { ArrowLeft, Trash2, AlertCircle, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function HistoryPage() {
  const router = useRouter();
  const {
    history,
    isLoading,
    isError,
    deleteItem,
    isDeletingItem,
    clearAll,
    isClearingAll,
  } = useResearchHistory();

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container flex-1 py-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/research")}
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back to research</span>
              </Button>
              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">
                  Research History
                </h1>
                <p className="text-sm text-muted-foreground">
                  {history.length} {history.length === 1 ? "item" : "items"}
                </p>
              </div>
            </div>
            {history.length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Clear all history?</DialogTitle>
                    <DialogDescription>
                      This will permanently delete all research history. This
                      action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {}}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => clearAll()}
                      disabled={isClearingAll}
                    >
                      {isClearingAll ? "Clearing..." : "Clear All"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {isLoading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <FormSkeleton key={i} />
              ))}
            </div>
          )}

          {isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load research history
              </AlertDescription>
            </Alert>
          )}

          {!isLoading && !isError && history.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No History</AlertTitle>
              <AlertDescription>
                You haven't performed any research yet.
              </AlertDescription>
            </Alert>
          )}

          {!isLoading && !isError && history.length > 0 && (
            <div className="space-y-4">
              {history.map((item) => (
                <Card key={item.sessionId}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="line-clamp-1">
                          {item.query}
                        </CardTitle>
                        <CardDescription>
                          {formatDate(item.timestamp)}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            router.push(`/research/${item.sessionId}`)
                          }
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span className="sr-only">View results</span>
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete this item?</DialogTitle>
                              <DialogDescription>
                                This will permanently delete this research
                                session.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => {}}>
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => deleteItem(item.sessionId)}
                                disabled={isDeletingItem}
                              >
                                {isDeletingItem ? "Deleting..." : "Delete"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Badge variant="secondary">
                        {item.learnings.length} learnings
                      </Badge>
                      <Badge variant="secondary">
                        {item.visitedUrls.length} sources
                      </Badge>
                      <Badge variant="secondary">
                        {formatDuration(item.duration)}
                      </Badge>
                      {item.success ? (
                        <Badge variant="default">Success</Badge>
                      ) : (
                        <Badge variant="destructive">Failed</Badge>
                      )}
                    </div>
                  </CardHeader>
                  {item.learnings.length > 0 && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.learnings[0]}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
