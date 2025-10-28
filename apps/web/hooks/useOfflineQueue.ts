"use client";

import { useState, useEffect, useCallback } from "react";
import { db, type OfflineQueueItem } from "@/lib/db";
import { apiClient } from "@/lib/api-client";

export function useOfflineQueue() {
  const [isOnline, setIsOnline] = useState(true);
  const [queueSize, setQueueSize] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Set initial status
    updateOnlineStatus();

    // Listen for online/offline events
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  // Update queue size
  const updateQueueSize = useCallback(async () => {
    try {
      const items = await db.getQueueItems();
      setQueueSize(items.length);
    } catch (error) {
      console.error("Error getting queue size:", error);
    }
  }, []);

  // Add item to queue
  const addToQueue = useCallback(
    async (type: "research", data: any) => {
      try {
        await db.addToQueue({ type, data });
        await updateQueueSize();
      } catch (error) {
        console.error("Error adding to queue:", error);
        throw error;
      }
    },
    [updateQueueSize],
  );

  // Process queue when online
  const processQueue = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      const items = await db.getQueueItems();

      for (const item of items) {
        try {
          // Process based on type
          if (item.type === "research") {
            await apiClient.post("/research", item.data);
          }

          // Remove from queue on success
          await db.removeFromQueue(item.id);
        } catch (error) {
          console.error("Error processing queue item:", error);

          // Increment retry count
          const newRetries = item.retries + 1;

          // Remove if max retries exceeded (5 attempts)
          if (newRetries >= 5) {
            console.warn("Max retries exceeded, removing item:", item.id);
            await db.removeFromQueue(item.id);
          } else {
            // Update retry count
            await db.updateQueueItem(item.id, { retries: newRetries });
          }
        }
      }

      await updateQueueSize();
    } catch (error) {
      console.error("Error processing queue:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, updateQueueSize]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline) {
      processQueue();
    }
  }, [isOnline, processQueue]);

  // Update queue size on mount
  useEffect(() => {
    updateQueueSize();
  }, [updateQueueSize]);

  // Clear queue
  const clearQueue = useCallback(async () => {
    try {
      await db.clearQueue();
      await updateQueueSize();
    } catch (error) {
      console.error("Error clearing queue:", error);
      throw error;
    }
  }, [updateQueueSize]);

  return {
    isOnline,
    queueSize,
    isSyncing,
    addToQueue,
    processQueue,
    clearQueue,
  };
}
