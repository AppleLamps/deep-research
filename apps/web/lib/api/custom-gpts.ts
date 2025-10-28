import type {
  CustomGPT,
  CreateCustomGPTRequest,
  UpdateCustomGPTRequest,
  KnowledgeFile,
  ApiResponse,
} from "@deep-research/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3051";

/**
 * Create a new custom GPT
 */
export async function createCustomGPT(
  request: CreateCustomGPTRequest
): Promise<CustomGPT> {
  const response = await fetch(`${API_BASE_URL}/custom-gpts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create custom GPT");
  }

  const data: ApiResponse<CustomGPT> = await response.json();
  if (!data.success || !data.data) {
    throw new Error(data.error || "Failed to create custom GPT");
  }

  return data.data;
}

/**
 * Get all custom GPTs
 */
export async function getAllCustomGPTs(): Promise<CustomGPT[]> {
  const response = await fetch(`${API_BASE_URL}/custom-gpts`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch custom GPTs");
  }

  const data: ApiResponse<CustomGPT[]> = await response.json();
  if (!data.success || !data.data) {
    throw new Error(data.error || "Failed to fetch custom GPTs");
  }

  return data.data;
}

/**
 * Get a custom GPT by ID
 */
export async function getCustomGPT(id: string): Promise<CustomGPT> {
  const response = await fetch(`${API_BASE_URL}/custom-gpts/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch custom GPT");
  }

  const data: ApiResponse<CustomGPT> = await response.json();
  if (!data.success || !data.data) {
    throw new Error(data.error || "Failed to fetch custom GPT");
  }

  return data.data;
}

/**
 * Update a custom GPT
 */
export async function updateCustomGPT(
  id: string,
  updates: Partial<UpdateCustomGPTRequest>
): Promise<CustomGPT> {
  const response = await fetch(`${API_BASE_URL}/custom-gpts/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update custom GPT");
  }

  const data: ApiResponse<CustomGPT> = await response.json();
  if (!data.success || !data.data) {
    throw new Error(data.error || "Failed to update custom GPT");
  }

  return data.data;
}

/**
 * Delete a custom GPT
 */
export async function deleteCustomGPT(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/custom-gpts/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete custom GPT");
  }
}

/**
 * Duplicate a custom GPT
 */
export async function duplicateCustomGPT(id: string): Promise<CustomGPT> {
  const response = await fetch(`${API_BASE_URL}/custom-gpts/${id}/duplicate`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to duplicate custom GPT");
  }

  const data: ApiResponse<CustomGPT> = await response.json();
  if (!data.success || !data.data) {
    throw new Error(data.error || "Failed to duplicate custom GPT");
  }

  return data.data;
}

/**
 * Upload a knowledge file to a custom GPT
 */
export async function uploadKnowledgeFile(
  customGptId: string,
  file: File
): Promise<KnowledgeFile> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}/custom-gpts/${customGptId}/knowledge`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to upload knowledge file");
  }

  const data: ApiResponse<KnowledgeFile> = await response.json();
  if (!data.success || !data.data) {
    throw new Error(data.error || "Failed to upload knowledge file");
  }

  return data.data;
}

/**
 * Delete a knowledge file from a custom GPT
 */
export async function deleteKnowledgeFile(
  customGptId: string,
  fileId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/custom-gpts/${customGptId}/knowledge/${fileId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete knowledge file");
  }
}

/**
 * Get relevant context from knowledge base
 */
export async function getRelevantContext(
  customGptId: string,
  query: string
): Promise<string> {
  const response = await fetch(
    `${API_BASE_URL}/custom-gpts/${customGptId}/context`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to get context");
  }

  const data: ApiResponse<{ context: string }> = await response.json();
  if (!data.success || !data.data) {
    throw new Error(data.error || "Failed to get context");
  }

  return data.data.context;
}

