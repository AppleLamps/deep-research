/**
 * Shared TypeScript types for Deep Research application
 * Used by both frontend (Next.js) and backend (Express)
 */

/**
 * LLM Provider types
 */
export type LLMProvider = "openai" | "fireworks" | "openrouter" | "custom";

export interface LLMConfig {
  provider?: LLMProvider;
  model?: string;
}

/**
 * Research query parameters
 */
export interface ResearchQuery {
  query: string;
  breadth: number; // 2-10: Number of follow-up questions per depth level
  depth: number; // 1-5: How many levels deep to research
  sessionId?: string; // Optional session ID for tracking
  llmConfig?: LLMConfig; // Optional LLM configuration override
  customGptId?: string; // Optional custom GPT ID to use
}

/**
 * Real-time progress updates during research
 */
export interface ResearchProgress {
  sessionId: string;
  currentDepth: number;
  totalDepth: number;
  currentBreadth: number;
  totalBreadth: number;
  currentQuery?: string;
  totalQueries: number;
  completedQueries: number;
  status: "pending" | "running" | "completed" | "error";
  progress: number; // 0-100 percentage
  message?: string; // Optional status message
}

/**
 * Final research result
 */
export interface ResearchResult {
  sessionId: string;
  query: string;
  learnings: string[];
  visitedUrls: string[];
  answer?: string;
  report?: string;
  timestamp: string;
  duration: number; // milliseconds
  success: boolean;
  error?: string;
}

/**
 * Research session tracking
 */
export interface ResearchSession {
  id: string;
  query: string;
  breadth: number;
  depth: number;
  status: "pending" | "running" | "completed" | "error";
  result?: ResearchResult;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: "ok" | "error";
  timestamp: string;
  uptime: number;
  version: string;
}

/**
 * File attachment types
 */
export type FileAttachmentType = "image" | "document";

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: FileAttachmentType;
  mimeType: string;
  url: string;
  thumbnail?: string;
  extractedText?: string; // For documents
  width?: number; // For images
  height?: number; // For images
}

/**
 * Chat message types for the chat interface
 */
export type ChatMessageRole = "user" | "assistant" | "system";

export type ChatMode = "chat" | "research";

export interface ThinkingStep {
  id: string;
  type: "query" | "search" | "analysis" | "depth" | "breadth" | "completion";
  title: string;
  description?: string;
  timestamp: number;
  data?: {
    query?: string;
    depth?: number;
    breadth?: number;
    progress?: number;
    completedQueries?: number;
    totalQueries?: number;
  };
}

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  timestamp: number;
  sessionId?: string;
  thinking?: ThinkingStep[];
  isStreaming?: boolean;
  mode?: ChatMode;
  attachments?: FileAttachment[];
  metadata?: {
    breadth?: number;
    depth?: number;
    duration?: number;
    learningsCount?: number;
    sourcesCount?: number;
  };
}

/**
 * Custom GPT types
 */
export interface CustomGPT {
  id: string;
  name: string;
  description: string;
  instructions: string;
  conversationStarters: string[];
  knowledgeFiles: KnowledgeFile[];
  settings: CustomGPTSettings;
  capabilities: CustomGPTCapabilities;
  createdAt: string;
  updatedAt: string;
  avatar?: string;
}

export interface CustomGPTSettings {
  recommendedModel?: {
    provider: LLMProvider;
    model: string;
  };
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface CustomGPTCapabilities {
  webSearch: boolean;
  fileAnalysis: boolean;
  imageGeneration: boolean;
  codeInterpreter: boolean;
}

export interface KnowledgeFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  storagePath: string;
  extractedText?: string;
  chunks?: TextChunk[];
  processingStatus: "pending" | "processing" | "completed" | "error";
  error?: string;
}

export interface TextChunk {
  id: string;
  text: string;
  startIndex: number;
  endIndex: number;
  embedding?: number[];
}

export interface CreateCustomGPTRequest {
  name: string;
  description: string;
  instructions: string;
  conversationStarters?: string[];
  settings?: Partial<CustomGPTSettings>;
  capabilities?: Partial<CustomGPTCapabilities>;
  avatar?: string;
}

export interface UpdateCustomGPTRequest extends Partial<CreateCustomGPTRequest> {
  id: string;
}
