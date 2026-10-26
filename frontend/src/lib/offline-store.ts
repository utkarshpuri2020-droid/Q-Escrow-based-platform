import { apiRequest } from "./api";

export interface OfflineDraft {
  local_draft_id: string;
  action_type: "CREATE_ESCROW" | "TRANSITION";
  payload: Record<string, any>;
  signature?: string;
  signing_key_id?: string;
  created_at: string;
  status: "QUEUED" | "SYNCED" | "FAILED";
  error?: string;
}

const STORAGE_KEY = "q_escrow_offline_drafts";

export class OfflineStore {
  static getDrafts(): OfflineDraft[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static saveDraft(draft: Omit<OfflineDraft, "local_draft_id" | "created_at" | "status">): OfflineDraft {
    const fullDraft: OfflineDraft = {
      ...draft,
      local_draft_id: `draft_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      created_at: new Date().toISOString(),
      status: "QUEUED",
    };

    const current = this.getDrafts();
    current.push(fullDraft);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    return fullDraft;
  }

  static async syncQueuedDrafts(): Promise<{ synced: number; failed: number; results: any[] }> {
    const all = this.getDrafts();
    const queued = all.filter((d) => d.status === "QUEUED");
    if (queued.length === 0) return { synced: 0, failed: 0, results: [] };

    try {
      const response = await apiRequest("/offline/sync", {
        method: "POST",
        body: JSON.stringify({
          events: queued.map((q) => ({
            local_draft_id: q.local_draft_id,
            action_type: q.action_type,
            payload: q.payload,
            signature: q.signature,
            signing_key_id: q.signing_key_id,
          })),
        }),
      });

      // Update local statuses based on server results
      const results = response.results || [];
      const updated = all.map((item) => {
        const res = results.find((r: any) => r.local_draft_id === item.local_draft_id);
        if (res) {
          if (res.status === "SUCCESS" || res.status === "ALREADY_SYNCED") {
            return { ...item, status: "SYNCED" as const, error: undefined };
          } else {
            return { ...item, status: "FAILED" as const, error: res.error };
          }
        }
        return item;
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      const synced = results.filter((r: any) => r.status === "SUCCESS" || r.status === "ALREADY_SYNCED").length;
      return { synced, failed: queued.length - synced, results };
    } catch (err: any) {
      return { synced: 0, failed: queued.length, results: [{ error: err.message }] };
    }
  }

  static clearSynced() {
    if (typeof window === "undefined") return;
    const remaining = this.getDrafts().filter((d) => d.status !== "SYNCED");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  }
}
