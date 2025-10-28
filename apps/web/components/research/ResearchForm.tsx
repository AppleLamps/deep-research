"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RESEARCH_LIMITS } from "@/lib/constants";
import { Loader2, Search, Info, Sparkles } from "lucide-react";
import type { ResearchQuery } from "@deep-research/types";

const researchSchema = z.object({
  query: z
    .string()
    .min(10, "Query must be at least 10 characters")
    .max(500, "Query must be less than 500 characters"),
  breadth: z
    .number()
    .min(RESEARCH_LIMITS.MIN_BREADTH)
    .max(RESEARCH_LIMITS.MAX_BREADTH),
  depth: z
    .number()
    .min(RESEARCH_LIMITS.MIN_DEPTH)
    .max(RESEARCH_LIMITS.MAX_DEPTH),
});

type ResearchFormData = z.infer<typeof researchSchema>;

interface ResearchFormProps {
  onSubmit: (data: ResearchQuery) => void;
  isLoading?: boolean;
}

export function ResearchForm({
  onSubmit,
  isLoading = false,
}: ResearchFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ResearchFormData>({
    resolver: zodResolver(researchSchema),
    defaultValues: {
      query: "",
      breadth: RESEARCH_LIMITS.DEFAULT_BREADTH,
      depth: RESEARCH_LIMITS.DEFAULT_DEPTH,
    },
  });

  const breadth = watch("breadth");
  const depth = watch("depth");

  const handleFormSubmit = (data: ResearchFormData) => {
    onSubmit(data);
  };

  return (
    <Card className="border-2">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Start Research</CardTitle>
            <CardDescription className="text-base">
              AI-powered deep research on any topic
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
          <div className="space-y-3">
            <Label htmlFor="query" className="text-base font-semibold">
              Research Query
            </Label>
            <Textarea
              id="query"
              placeholder="What would you like to research? Be specific for better results.&#10;&#10;Example: 'What are the latest developments in quantum computing and their potential applications in cryptography?'"
              {...register("query")}
              disabled={isLoading}
              className={`min-h-[140px] resize-none text-base ${errors.query ? "border-destructive" : ""}`}
            />
            {errors.query && (
              <p className="text-sm text-destructive">{errors.query.message}</p>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="breadth"
                  className="flex items-center gap-2 text-base font-semibold"
                >
                  Breadth
                  <span className="rounded-md bg-muted px-2 py-0.5 text-sm font-medium">
                    {breadth}
                  </span>
                </Label>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Number of sources to explore at each depth level"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>
              <Slider
                id="breadth"
                min={RESEARCH_LIMITS.MIN_BREADTH}
                max={RESEARCH_LIMITS.MAX_BREADTH}
                step={1}
                value={[breadth]}
                onValueChange={(value) => setValue("breadth", value[0])}
                disabled={isLoading}
                className="py-4"
              />
              <p className="text-sm text-muted-foreground">
                Number of sources to explore at each depth level
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="depth"
                  className="flex items-center gap-2 text-base font-semibold"
                >
                  Depth
                  <span className="rounded-md bg-muted px-2 py-0.5 text-sm font-medium">
                    {depth}
                  </span>
                </Label>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="How many levels deep to follow research leads"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>
              <Slider
                id="depth"
                min={RESEARCH_LIMITS.MIN_DEPTH}
                max={RESEARCH_LIMITS.MAX_DEPTH}
                step={1}
                value={[depth]}
                onValueChange={(value) => setValue("depth", value[0])}
                disabled={isLoading}
                className="py-4"
              />
              <p className="text-sm text-muted-foreground">
                How many levels deep to follow research leads
              </p>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold"
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Starting Research...
              </>
            ) : (
              <>
                <Search className="mr-2 h-5 w-5" />
                Start Research
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
