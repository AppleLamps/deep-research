"use client";

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      // Check if running as standalone PWA
      if (window.matchMedia("(display-mode: standalone)").matches) {
        setIsInstalled(true);
        return true;
      }
      // Check if running as iOS PWA
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
        return true;
      }
      return false;
    };

    if (checkInstalled()) {
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setInstallPrompt(promptEvent);
      setIsInstallable(true);
      console.log("Install prompt available");
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
      console.log("App installed");

      // Track installation
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "pwa_install", {
          event_category: "engagement",
          event_label: "PWA Installed",
        });
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!installPrompt) {
      console.log("Install prompt not available");
      return false;
    }

    try {
      // Show the install prompt
      await installPrompt.prompt();

      // Wait for the user's response
      const { outcome } = await installPrompt.userChoice;

      console.log(`User response: ${outcome}`);

      // Track user choice
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "pwa_install_prompt", {
          event_category: "engagement",
          event_label: outcome === "accepted" ? "Accepted" : "Dismissed",
        });
      }

      if (outcome === "accepted") {
        setIsInstallable(false);
        setInstallPrompt(null);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error showing install prompt:", error);
      return false;
    }
  }, [installPrompt]);

  const dismissPrompt = useCallback(() => {
    setIsInstallable(false);

    // Track dismissal
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "pwa_install_banner_dismissed", {
        event_category: "engagement",
      });
    }

    // Store dismissal in localStorage to not show again for a while
    if (typeof window !== "undefined") {
      localStorage.setItem("pwa-install-dismissed", new Date().toISOString());
    }
  }, []);

  // Check if prompt was recently dismissed
  useEffect(() => {
    if (typeof window === "undefined") return;

    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissed =
        (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);

      // Don't show prompt if dismissed within last 7 days
      if (daysSinceDismissed < 7) {
        setIsInstallable(false);
      }
    }
  }, []);

  return {
    isInstallable,
    isInstalled,
    promptInstall,
    dismissPrompt,
  };
}
