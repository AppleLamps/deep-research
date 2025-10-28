export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3051";
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Deep Research";

export const API_ENDPOINTS = {
  HEALTH: "/health",
  RESEARCH: "/research",
  CHAT: "/chat",
  SESSION: "/session",
} as const;

export const RESEARCH_LIMITS = {
  MIN_BREADTH: 2,
  MAX_BREADTH: 10,
  MIN_DEPTH: 1,
  MAX_DEPTH: 5,
  DEFAULT_BREADTH: 5,
  DEFAULT_DEPTH: 3,
} as const;

export const QUERY_KEYS = {
  HEALTH: ["health"],
  RESEARCH: ["research"],
  SESSION: (id: string) => ["session", id],
} as const;
