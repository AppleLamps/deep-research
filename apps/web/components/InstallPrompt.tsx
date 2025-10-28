"use client";

import { Download, X } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { Button } from "@/components/ui/button";

export function InstallPrompt() {
  const { isInstallable, promptInstall, dismissPrompt } = useInstallPrompt();

  if (!isInstallable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md">
      <div className="rounded-lg border border-border bg-card p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Download className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold text-card-foreground">
              Install Deep Research
            </h3>
            <p className="text-sm text-muted-foreground">
              Install our app for a better experience with offline support and
              faster access.
            </p>
          </div>
          <button
            onClick={dismissPrompt}
            className="shrink-0 rounded-md p-1 hover:bg-accent"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={promptInstall} className="flex-1">
            Install
          </Button>
          <Button onClick={dismissPrompt} variant="outline">
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
}
