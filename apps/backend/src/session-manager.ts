import type { ResearchProgress, ResearchResult } from '@deep-research/types';
import { v4 as uuidv4 } from 'uuid';

interface SessionData {
  sessionId: string;
  query: string;
  breadth: number;
  depth: number;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: ResearchProgress | null;
  result: ResearchResult | null;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

class SessionManager {
  private sessions: Map<string, SessionData> = new Map();
  private readonly SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
  private readonly CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

  constructor() {
    // Start cleanup interval
    setInterval(() => this.cleanupExpiredSessions(), this.CLEANUP_INTERVAL_MS);
  }

  createSession(query: string, breadth: number, depth: number): string {
    const sessionId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.SESSION_EXPIRY_MS);

    const sessionData: SessionData = {
      sessionId,
      query,
      breadth,
      depth,
      status: 'pending',
      progress: null,
      result: null,
      createdAt: now,
      updatedAt: now,
      expiresAt,
    };

    this.sessions.set(sessionId, sessionData);
    return sessionId;
  }

  getSession(sessionId: string): SessionData | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Check if expired
    if (new Date() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return null;
    }

    return session;
  }

  updateSessionStatus(sessionId: string, status: SessionData['status']): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = status;
      session.updatedAt = new Date();
    }
  }

  updateSessionProgress(sessionId: string, progress: ResearchProgress): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.progress = progress;
      session.updatedAt = new Date();
    }
  }

  updateSessionResult(sessionId: string, result: ResearchResult): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.result = result;
      session.status = 'completed';
      session.updatedAt = new Date();
    }
  }

  setSessionError(sessionId: string, error: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'error';
      session.result = {
        sessionId,
        query: session.query,
        learnings: [],
        visitedUrls: [],
        timestamp: new Date().toISOString(),
        duration: 0,
        success: false,
        error,
      };
      session.updatedAt = new Date();
    }
  }

  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  getAllSessions(): SessionData[] {
    return Array.from(this.sessions.values()).filter(
      session => new Date() <= session.expiresAt,
    );
  }

  private cleanupExpiredSessions(): void {
    const now = new Date();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        expiredSessions.push(sessionId);
      }
    }

    expiredSessions.forEach(sessionId => {
      this.sessions.delete(sessionId);
      console.log(`Cleaned up expired session: ${sessionId}`);
    });

    if (expiredSessions.length > 0) {
      console.log(`Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
