import type { ResearchResult, CustomGPT } from "@deep-research/types";

const DB_NAME = "deep-research-db";
const DB_VERSION = 2;

// Store names
const STORES = {
  RESEARCH_RESULTS: "research_results",
  OFFLINE_QUEUE: "offline_queue",
  CUSTOM_GPTS: "custom_gpts",
  ACTIVE_CUSTOM_GPT: "active_custom_gpt",
} as const;

interface OfflineQueueItem {
  id: string;
  type: "research";
  data: any;
  timestamp: number;
  retries: number;
}

class Database {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create research results store
        if (!db.objectStoreNames.contains(STORES.RESEARCH_RESULTS)) {
          const resultsStore = db.createObjectStore(STORES.RESEARCH_RESULTS, {
            keyPath: "sessionId",
          });
          resultsStore.createIndex("timestamp", "timestamp", { unique: false });
          resultsStore.createIndex("query", "query", { unique: false });
        }

        // Create offline queue store
        if (!db.objectStoreNames.contains(STORES.OFFLINE_QUEUE)) {
          const queueStore = db.createObjectStore(STORES.OFFLINE_QUEUE, {
            keyPath: "id",
          });
          queueStore.createIndex("timestamp", "timestamp", { unique: false });
          queueStore.createIndex("type", "type", { unique: false });
        }

        // Create custom GPTs store
        if (!db.objectStoreNames.contains(STORES.CUSTOM_GPTS)) {
          const customGptsStore = db.createObjectStore(STORES.CUSTOM_GPTS, {
            keyPath: "id",
          });
          customGptsStore.createIndex("createdAt", "createdAt", { unique: false });
          customGptsStore.createIndex("updatedAt", "updatedAt", { unique: false });
          customGptsStore.createIndex("name", "name", { unique: false });
        }

        // Create active custom GPT store
        if (!db.objectStoreNames.contains(STORES.ACTIVE_CUSTOM_GPT)) {
          db.createObjectStore(STORES.ACTIVE_CUSTOM_GPT, {
            keyPath: "mode",
          });
        }
      };
    });
  }

  private async getStore(
    storeName: string,
    mode: IDBTransactionMode = "readonly",
  ): Promise<IDBObjectStore> {
    await this.init();
    if (!this.db) throw new Error("Database not initialized");
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // Research Results operations
  async saveResearchResult(result: ResearchResult): Promise<void> {
    const store = await this.getStore(STORES.RESEARCH_RESULTS, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.put(result);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getResearchResult(sessionId: string): Promise<ResearchResult | null> {
    const store = await this.getStore(STORES.RESEARCH_RESULTS);
    return new Promise((resolve, reject) => {
      const request = store.get(sessionId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllResearchResults(): Promise<ResearchResult[]> {
    const store = await this.getStore(STORES.RESEARCH_RESULTS);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteResearchResult(sessionId: string): Promise<void> {
    const store = await this.getStore(STORES.RESEARCH_RESULTS, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.delete(sessionId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearResearchResults(): Promise<void> {
    const store = await this.getStore(STORES.RESEARCH_RESULTS, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Offline Queue operations
  async addToQueue(
    item: Omit<OfflineQueueItem, "id" | "timestamp" | "retries">,
  ): Promise<string> {
    const queueItem: OfflineQueueItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retries: 0,
    };

    const store = await this.getStore(STORES.OFFLINE_QUEUE, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.add(queueItem);
      request.onsuccess = () => resolve(queueItem.id);
      request.onerror = () => reject(request.error);
    });
  }

  async getQueueItems(): Promise<OfflineQueueItem[]> {
    const store = await this.getStore(STORES.OFFLINE_QUEUE);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async removeFromQueue(id: string): Promise<void> {
    const store = await this.getStore(STORES.OFFLINE_QUEUE, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateQueueItem(
    id: string,
    updates: Partial<OfflineQueueItem>,
  ): Promise<void> {
    const store = await this.getStore(STORES.OFFLINE_QUEUE, "readwrite");
    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (!item) {
          reject(new Error("Queue item not found"));
          return;
        }
        const updatedItem = { ...item, ...updates };
        const putRequest = store.put(updatedItem);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async clearQueue(): Promise<void> {
    const store = await this.getStore(STORES.OFFLINE_QUEUE, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Custom GPT operations
  async saveCustomGPT(customGPT: CustomGPT): Promise<void> {
    const store = await this.getStore(STORES.CUSTOM_GPTS, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.put(customGPT);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCustomGPT(id: string): Promise<CustomGPT | null> {
    const store = await this.getStore(STORES.CUSTOM_GPTS);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllCustomGPTs(): Promise<CustomGPT[]> {
    const store = await this.getStore(STORES.CUSTOM_GPTS);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteCustomGPT(id: string): Promise<void> {
    const store = await this.getStore(STORES.CUSTOM_GPTS, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearCustomGPTs(): Promise<void> {
    const store = await this.getStore(STORES.CUSTOM_GPTS, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Active Custom GPT operations
  async setActiveCustomGPT(mode: "chat" | "research", customGptId: string | null): Promise<void> {
    const store = await this.getStore(STORES.ACTIVE_CUSTOM_GPT, "readwrite");
    return new Promise((resolve, reject) => {
      const request = customGptId
        ? store.put({ mode, customGptId })
        : store.delete(mode);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getActiveCustomGPT(mode: "chat" | "research"): Promise<string | null> {
    const store = await this.getStore(STORES.ACTIVE_CUSTOM_GPT);
    return new Promise((resolve, reject) => {
      const request = store.get(mode);
      request.onsuccess = () => resolve(request.result?.customGptId || null);
      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
export const db = new Database();

// Export types
export type { OfflineQueueItem };
