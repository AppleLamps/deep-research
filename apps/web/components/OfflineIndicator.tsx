"use client";

import { WifiOff, Wifi, CloudOff } from "lucide-react";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";

export function OfflineIndicator() {
  const { isOnline, queueSize, isSyncing } = useOfflineQueue();

  if (isOnline && queueSize === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`flex items-center gap-2 rounded-lg px-4 py-2 shadow-lg ${
          isOnline ? "bg-blue-500 text-white" : "bg-yellow-500 text-yellow-950"
        }`}
      >
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span className="text-sm font-medium">
              {isSyncing
                ? `Syncing ${queueSize} item${queueSize !== 1 ? "s" : ""}...`
                : `${queueSize} item${queueSize !== 1 ? "s" : ""} queued`}
            </span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">
              Offline
              {queueSize > 0 &&
                ` - ${queueSize} item${queueSize !== 1 ? "s" : ""} queued`}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
