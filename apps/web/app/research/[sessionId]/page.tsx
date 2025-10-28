"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ResultsDisplay } from "@/components/research/ResultsDisplay";
import { ResultsSkeleton } from "@/components/SkeletonLoader";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { ResearchResult } from "@deep-research/types";

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get<ResearchResult>(
          `/session/${sessionId}`,
        );
        setResult(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load results");
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionId) {
      fetchResult();
    }
  }, [sessionId]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container flex-1 py-8">
        <div className="mx-auto max-w-4xl space-y-8">
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
                Research Results
              </h1>
              <p className="text-sm text-muted-foreground">
                Session: {sessionId.slice(0, 8)}
              </p>
            </div>
          </div>

          {isLoading && <ResultsSkeleton />}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && !isLoading && !error && <ResultsDisplay result={result} />}

          {!result && !isLoading && !error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Results</AlertTitle>
              <AlertDescription>
                No results found for this session.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
