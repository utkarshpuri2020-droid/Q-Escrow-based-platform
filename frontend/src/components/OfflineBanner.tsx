"use client";

import React, { useEffect, useState } from "react";
import { WifiOff, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { OfflineStore } from "@/lib/offline-store";

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [queuedCount, setQueuedCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const updateStatus = () => {
    setIsOnline(navigator.onLine);
    const drafts = OfflineStore.getDrafts();
    setQueuedCount(drafts.filter((d) => d.status === "QUEUED").length);
  };

  useEffect(() => {
    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    const interval = setInterval(updateStatus, 5000);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
      clearInterval(interval);
    };
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      const res = await OfflineStore.syncQueuedDrafts();
      if (res.synced > 0) {
        setMessage(`Successfully synced ${res.synced} offline transaction(s)!`);
      } else if (res.failed > 0) {
        setMessage(`Sync failed for ${res.failed} item(s). Check connection or terms.`);
      }
      updateStatus();
    } catch {
      setMessage("Sync encountered an error.");
    } finally {
      setSyncing(false);
    }
  };

  if (isOnline && queuedCount === 0 && !message) {
    return null;
  }

  return (
    <div className="bg-amber-500/10 dark:bg-amber-900/30 border-b border-amber-500/20 px-4 py-2.5 text-xs text-amber-800 dark:text-amber-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <>
              <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
              <span className="font-semibold">Offline Mode Active:</span>
              <span>
                You are currently disconnected. You can draft transactions locally.
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>
                You have <strong className="font-semibold">{queuedCount}</strong> offline drafted event(s) awaiting server synchronization.
              </span>
            </>
          )}

          {message && (
            <span className="ml-2 font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              {message}
            </span>
          )}
        </div>

        {isOnline && queuedCount > 0 && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-md shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            <span>{syncing ? "Synchronizing..." : "Sync Now"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
