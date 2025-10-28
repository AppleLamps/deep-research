import { useState, useEffect, useCallback } from "react";
import type {
  CustomGPT,
  CreateCustomGPTRequest,
  UpdateCustomGPTRequest,
  KnowledgeFile,
} from "@deep-research/types";
import { db } from "@/lib/db";
import * as customGPTsAPI from "@/lib/api/custom-gpts";
import { toast } from "sonner";

export function useCustomGPTs() {
  const [customGPTs, setCustomGPTs] = useState<CustomGPT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load custom GPTs from IndexedDB on mount
  useEffect(() => {
    loadCustomGPTs();
  }, []);

  const loadCustomGPTs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load from IndexedDB first (fast)
      const localGPTs = await db.getAllCustomGPTs();
      setCustomGPTs(localGPTs);

      // Then sync with server
      try {
        const serverGPTs = await customGPTsAPI.getAllCustomGPTs();

        // Update IndexedDB with server data
        for (const gpt of serverGPTs) {
          await db.saveCustomGPT(gpt);
        }

        setCustomGPTs(serverGPTs);
      } catch (serverError) {
        console.error("Failed to sync with server:", serverError);
        // Continue with local data
      }
    } catch (err: any) {
      console.error("Error loading custom GPTs:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCustomGPT = useCallback(
    async (request: CreateCustomGPTRequest): Promise<CustomGPT> => {
      try {
        const newGPT = await customGPTsAPI.createCustomGPT(request);

        // Save to IndexedDB
        await db.saveCustomGPT(newGPT);

        // Update state
        setCustomGPTs((prev) => [...prev, newGPT]);

        toast.success("Custom GPT created successfully");
        return newGPT;
      } catch (err: any) {
        console.error("Error creating custom GPT:", err);
        toast.error(err.message || "Failed to create custom GPT");
        throw err;
      }
    },
    []
  );

  const updateCustomGPT = useCallback(
    async (
      id: string,
      updates: Partial<UpdateCustomGPTRequest>
    ): Promise<CustomGPT> => {
      try {
        const updatedGPT = await customGPTsAPI.updateCustomGPT(id, updates);

        // Update IndexedDB
        await db.saveCustomGPT(updatedGPT);

        // Update state
        setCustomGPTs((prev) =>
          prev.map((gpt) => (gpt.id === id ? updatedGPT : gpt))
        );

        toast.success("Custom GPT updated successfully");
        return updatedGPT;
      } catch (err: any) {
        console.error("Error updating custom GPT:", err);
        toast.error(err.message || "Failed to update custom GPT");
        throw err;
      }
    },
    []
  );

  const deleteCustomGPT = useCallback(async (id: string): Promise<void> => {
    try {
      await customGPTsAPI.deleteCustomGPT(id);

      // Delete from IndexedDB
      await db.deleteCustomGPT(id);

      // Update state
      setCustomGPTs((prev) => prev.filter((gpt) => gpt.id !== id));

      toast.success("Custom GPT deleted successfully");
    } catch (err: any) {
      console.error("Error deleting custom GPT:", err);
      toast.error(err.message || "Failed to delete custom GPT");
      throw err;
    }
  }, []);

  const duplicateCustomGPT = useCallback(
    async (id: string): Promise<CustomGPT> => {
      try {
        const duplicate = await customGPTsAPI.duplicateCustomGPT(id);

        // Save to IndexedDB
        await db.saveCustomGPT(duplicate);

        // Update state
        setCustomGPTs((prev) => [...prev, duplicate]);

        toast.success("Custom GPT duplicated successfully");
        return duplicate;
      } catch (err: any) {
        console.error("Error duplicating custom GPT:", err);
        toast.error(err.message || "Failed to duplicate custom GPT");
        throw err;
      }
    },
    []
  );

  const uploadKnowledgeFile = useCallback(
    async (customGptId: string, file: File): Promise<KnowledgeFile> => {
      try {
        const knowledgeFile = await customGPTsAPI.uploadKnowledgeFile(
          customGptId,
          file
        );

        // Reload custom GPT to get updated knowledge files
        await loadCustomGPTs();

        toast.success("Knowledge file uploaded successfully");
        return knowledgeFile;
      } catch (err: any) {
        console.error("Error uploading knowledge file:", err);
        toast.error(err.message || "Failed to upload knowledge file");
        throw err;
      }
    },
    [loadCustomGPTs]
  );

  const deleteKnowledgeFile = useCallback(
    async (customGptId: string, fileId: string): Promise<void> => {
      try {
        await customGPTsAPI.deleteKnowledgeFile(customGptId, fileId);

        // Reload custom GPT to get updated knowledge files
        await loadCustomGPTs();

        toast.success("Knowledge file deleted successfully");
      } catch (err: any) {
        console.error("Error deleting knowledge file:", err);
        toast.error(err.message || "Failed to delete knowledge file");
        throw err;
      }
    },
    [loadCustomGPTs]
  );

  const getCustomGPT = useCallback(
    (id: string): CustomGPT | undefined => {
      return customGPTs.find((gpt) => gpt.id === id);
    },
    [customGPTs]
  );

  return {
    customGPTs,
    loading,
    error,
    createCustomGPT,
    updateCustomGPT,
    deleteCustomGPT,
    duplicateCustomGPT,
    uploadKnowledgeFile,
    deleteKnowledgeFile,
    getCustomGPT,
    reload: loadCustomGPTs,
  };
}

export function useActiveCustomGPT(mode: "chat" | "research") {
  const [activeCustomGptId, setActiveCustomGptId] = useState<string | null>(
    null
  );
  const [activeCustomGPT, setActiveCustomGPT_State] = useState<CustomGPT | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const { customGPTs } = useCustomGPTs();

  // Load active custom GPT from IndexedDB on mount
  useEffect(() => {
    loadActiveCustomGPT();
  }, [mode]);

  // Update activeCustomGPT when customGPTs or activeCustomGptId changes
  useEffect(() => {
    if (activeCustomGptId) {
      const gpt = customGPTs.find((g) => g.id === activeCustomGptId);
      setActiveCustomGPT_State(gpt || null);
    } else {
      setActiveCustomGPT_State(null);
    }
  }, [activeCustomGptId, customGPTs]);

  const loadActiveCustomGPT = async () => {
    try {
      setLoading(true);
      const id = await db.getActiveCustomGPT(mode);
      setActiveCustomGptId(id);
    } catch (err) {
      console.error("Error loading active custom GPT:", err);
    } finally {
      setLoading(false);
    }
  };

  const setActiveCustomGPT = useCallback(
    async (customGptId: string | null) => {
      try {
        await db.setActiveCustomGPT(mode, customGptId);
        setActiveCustomGptId(customGptId);
      } catch (err) {
        console.error("Error setting active custom GPT:", err);
        toast.error("Failed to set active custom GPT");
      }
    },
    [mode]
  );

  return {
    activeCustomGptId,
    activeCustomGPT,
    loading,
    setActiveCustomGPT,
  };
}

