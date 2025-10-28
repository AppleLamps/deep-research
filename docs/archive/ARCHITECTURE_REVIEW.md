# Deep Research Application - Comprehensive Architecture Review

## Executive Summary

This document provides a detailed analysis of the Deep Research application's architecture, identifying critical issues, race conditions, type mismatches, and architectural improvements needed for production readiness.

---

## 1. Backend API Flow Analysis

### 1.1 `/research` Endpoint (apps/backend/src/api.ts:50-157)

**Current Flow:**

1. Validates request body with Zod schema (lines 38-42)
2. Creates session immediately (line 59)
3. Returns `{ sessionId, status: 'pending' }` (line 63)
4. Starts research in background (lines 69-147)
5. Emits progress via SSE to connected clients

**✅ Strengths:**

- Non-blocking design - returns sessionId immediately
- Proper validation with Zod
- Rate limiting applied
- Error handling for both sync and async errors

**❌ Critical Issues:**

#### Issue 1.1: No Backend Cancellation Support

**Location:** `apps/backend/src/api.ts` and `apps/backend/src/deep-research.ts`

The frontend can "cancel" by closing the SSE connection, but the backend continues processing:

- `deepResearch()` function has no abort mechanism
- Firecrawl API calls continue even after user cancels
- Wastes API credits and server resources

**Impact:** High - Resource waste, cost implications

**Recommendation:**

```typescript
// Add AbortController support
export async function deepResearch({
  query,
  breadth,
  depth,
  learnings = [],
  visitedUrls = [],
  onProgress,
  abortSignal, // NEW
}: {
  // ... existing params
  abortSignal?: AbortSignal;
}): Promise<ResearchResult> {
  // Check for cancellation before each operation
  if (abortSignal?.aborted) {
    throw new Error("Research cancelled");
  }

  // Pass to Firecrawl
  const result = await firecrawl.search(serpQuery.query, {
    timeout: 15000,
    limit: 5,
    scrapeOptions: { formats: ["markdown"] },
    signal: abortSignal, // Pass through
  });
}
```

#### Issue 1.2: Type Mismatch - ResearchProgress

**Location:** `apps/backend/src/deep-research.ts:14-22` vs `packages/types/index.ts:19-31`

Backend defines local type:

```typescript
// apps/backend/src/deep-research.ts:14-22
export type ResearchProgress = {
  currentDepth: number;
  totalDepth: number;
  currentBreadth: number;
  totalBreadth: number;
  currentQuery?: string;
  totalQueries: number;
  completedQueries: number;
  // MISSING: sessionId, status, progress, message
};
```

But API uses shared type from `@deep-research/types`:

```typescript
// packages/types/index.ts:19-31
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
  progress: number;
  message?: string;
}
```

**Impact:** Critical - Type safety broken, potential runtime errors

**Recommendation:** Remove duplicate type definition in `deep-research.ts`, use shared type

---

### 1.2 SSE Implementation (apps/backend/src/api.ts:188-225)

**Current Implementation:**

- Uses in-memory Map to store SSE clients per session
- Sends progress updates via `sendProgressUpdate()` helper
- Handles client disconnect cleanup

**❌ Critical Issues:**

#### Issue 1.3: Memory Leak - SSE Clients Not Cleaned on Error

**Location:** `apps/backend/src/api.ts:228-240`

```typescript
function sendProgressUpdate(sessionId: string, progress: ResearchProgress) {
  const clients = sseClients.get(sessionId);
  if (clients && clients.length > 0) {
    const data = `data: ${JSON.stringify(progress)}\n\n`;
    clients.forEach((client) => {
      try {
        client.write(data);
      } catch (error) {
        console.error("Error sending SSE update:", error);
        // ❌ Client is NOT removed from array on write error
      }
    });
  }
}
```

**Impact:** High - Memory leak, dead connections accumulate

**Recommendation:**

```typescript
function sendProgressUpdate(sessionId: string, progress: ResearchProgress) {
  const clients = sseClients.get(sessionId);
  if (!clients || clients.length === 0) return;

  const data = `data: ${JSON.stringify(progress)}\n\n`;
  const deadClients: Response[] = [];

  clients.forEach((client) => {
    try {
      client.write(data);
    } catch (error) {
      console.error("Error sending SSE update:", error);
      deadClients.push(client);
    }
  });

  // Remove dead clients
  if (deadClients.length > 0) {
    const remaining = clients.filter((c) => !deadClients.includes(c));
    if (remaining.length === 0) {
      sseClients.delete(sessionId);
    } else {
      sseClients.set(sessionId, remaining);
    }
  }
}
```

#### Issue 1.4: Race Condition - Progress Before SSE Connection

**Location:** `apps/backend/src/api.ts:63-88`

Timeline:

1. Client calls `/research` → gets sessionId
2. Research starts in background (line 69)
3. Progress updates start emitting (line 87)
4. Client connects to `/progress/:sessionId` (may be delayed)
5. **Early progress updates are lost**

**Impact:** Medium - User sees incomplete progress

**Current Mitigation:** Lines 206-209 send initial progress if available
**Problem:** Only sends LAST progress, not all missed updates

**Recommendation:** Buffer progress updates per session

```typescript
const progressBuffer = new Map<string, ResearchProgress[]>();

function sendProgressUpdate(sessionId: string, progress: ResearchProgress) {
  // Buffer for late-connecting clients
  if (!progressBuffer.has(sessionId)) {
    progressBuffer.set(sessionId, []);
  }
  progressBuffer.get(sessionId)!.push(progress);

  // Keep only last 50 updates
  const buffer = progressBuffer.get(sessionId)!;
  if (buffer.length > 50) {
    buffer.shift();
  }

  // Send to connected clients
  const clients = sseClients.get(sessionId);
  // ... existing send logic
}

// In SSE endpoint, send buffered updates
app.get("/progress/:sessionId", (req, res) => {
  // ... existing setup

  // Send buffered progress
  const buffer = progressBuffer.get(sessionId) || [];
  buffer.forEach((progress) => {
    res.write(`data: ${JSON.stringify(progress)}\n\n`);
  });

  // ... rest of handler
});
```

---

## 2. Frontend Integration Review

### 2.1 useChat Hook (apps/web/hooks/useChat.ts)

**❌ Critical Issues:**

#### Issue 2.1: Infinite Re-render Loop

**Location:** `apps/web/hooks/useChat.ts:172-175`

```typescript
// Handle progress updates
if (progress) {
  updateThinkingSteps(progress);
}
```

**Problem:** This runs on EVERY render when progress exists, not just when progress changes!

**Impact:** Critical - Performance degradation, excessive re-renders

**Recommendation:**

```typescript
// Use useEffect with dependency
useEffect(() => {
  if (progress) {
    updateThinkingSteps(progress);
  }
}, [progress, updateThinkingSteps]);
```

#### Issue 2.2: State Mutation - Direct Array Modification

**Location:** `apps/web/hooks/useChat.ts:37-53, 59-69, 81-169, 214-224`

Multiple places directly mutate state:

```typescript
setMessages((prev) => {
  const updated = [...prev];
  const lastMessage = updated[updated.length - 1];

  if (lastMessage && lastMessage.role === "assistant") {
    lastMessage.content = result.report || ...;  // ❌ MUTATION
    lastMessage.isStreaming = false;             // ❌ MUTATION
    lastMessage.metadata = { ... };              // ❌ MUTATION
  }

  return updated;
});
```

**Impact:** Medium - Breaks React's immutability contract, potential bugs

**Recommendation:**

```typescript
setMessages((prev) => {
  const updated = [...prev];
  const lastIndex = updated.length - 1;
  const lastMessage = updated[lastIndex];

  if (lastMessage && lastMessage.role === "assistant") {
    updated[lastIndex] = {
      ...lastMessage,
      content: result.report || result.answer || "Research completed.",
      isStreaming: false,
      metadata: {
        breadth: result.learnings.length,
        depth: finalProgress.totalDepth,
        duration: result.duration,
        learningsCount: result.learnings.length,
        sourcesCount: result.visitedUrls.length,
      },
    };
  }

  return updated;
});
```

#### Issue 2.3: Unused Ref - thinkingStepsRef

**Location:** `apps/web/hooks/useChat.ts:18, 73, 227, 234`

```typescript
const thinkingStepsRef = useRef<Map<string, ThinkingStep[]>>(new Map());
```

This ref is created but thinking steps are stored directly in message state (line 165).
The ref is only used for cleanup, which is unnecessary.

**Impact:** Low - Code smell, confusion

**Recommendation:** Remove the ref entirely

---

### 2.2 useResearchProgress Hook (apps/web/hooks/useResearchProgress.ts)

**✅ Strengths:**

- Proper SSE connection management
- Exponential backoff for reconnection
- Cleanup on unmount
- Error handling

**❌ Issues:**

#### Issue 2.4: Reconnection on Completion

**Location:** `apps/web/hooks/useResearchProgress.ts:77-94`

```typescript
eventSource.onerror = () => {
  setIsConnected(false);

  if (reconnectAttemptsRef.current < maxReconnectAttempts) {
    reconnectAttemptsRef.current++;
    const delay = Math.min(
      1000 * Math.pow(2, reconnectAttemptsRef.current),
      10000,
    );

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }
  // ...
};
```

**Problem:** When research completes, server closes SSE connection, triggering `onerror`.
This causes unnecessary reconnection attempts.

**Impact:** Low - Wasted network requests, console errors

**Recommendation:**

```typescript
const completedRef = useRef(false);

eventSource.onmessage = (event) => {
  try {
    const data: ResearchProgress = JSON.parse(event.data);
    setProgress(data);

    if (data.status === "completed") {
      completedRef.current = true; // Mark as completed
      onComplete?.(data);
      cleanup();
    } else if (data.status === "error") {
      completedRef.current = true; // Mark as completed
      const err = new Error(data.message || "Research failed");
      setError(err);
      onError?.(err);
      cleanup();
    }
  } catch (err) {
    console.error("Failed to parse progress data:", err);
  }
};

eventSource.onerror = () => {
  setIsConnected(false);

  // Don't reconnect if completed
  if (completedRef.current) {
    cleanup();
    return;
  }

  // ... existing reconnection logic
};
```

---

## 3. Type Safety & Data Mapping

### 3.1 Type Mismatches

#### Issue 3.1: Duplicate ResearchProgress Type

**Already covered in Issue 1.2**

#### Issue 3.2: Missing answer Field Usage

**Location:** `packages/types/index.ts:41` and `apps/backend/src/api.ts:101-110`

Type defines `answer?` field but backend never sets it:

```typescript
const result: ResearchResult = {
  sessionId,
  query,
  learnings,
  visitedUrls,
  report, // ✅ Set
  // answer: undefined  // ❌ Never set
  timestamp: new Date().toISOString(),
  duration,
  success: true,
};
```

Frontend tries to use it:

```typescript
lastMessage.content = result.report || result.answer || "Research completed.";
```

**Impact:** Low - Fallback works, but confusing

**Recommendation:** Either remove `answer` field or implement `writeFinalAnswer()` usage

---

## 4. Critical Issues Summary

### 🔴 Critical (Fix Immediately)

1. **Infinite Re-render Loop** (Issue 2.1)

   - File: `apps/web/hooks/useChat.ts:172-175`
   - Fix: Use `useEffect` with dependencies

2. **Type Mismatch** (Issue 1.2)

   - File: `apps/backend/src/deep-research.ts:14-22`
   - Fix: Remove duplicate type, use shared type

3. **State Mutation** (Issue 2.2)
   - File: `apps/web/hooks/useChat.ts` (multiple locations)
   - Fix: Use immutable updates

### 🟡 High Priority

4. **No Backend Cancellation** (Issue 1.1)

   - Files: `apps/backend/src/api.ts`, `apps/backend/src/deep-research.ts`
   - Fix: Add AbortController support

5. **Memory Leak - SSE Clients** (Issue 1.3)
   - File: `apps/backend/src/api.ts:228-240`
   - Fix: Remove dead clients from array

### 🟢 Medium Priority

6. **Race Condition - Progress Loss** (Issue 1.4)

   - File: `apps/backend/src/api.ts:63-88`
   - Fix: Buffer progress updates

7. **Unnecessary Reconnection** (Issue 2.4)
   - File: `apps/web/hooks/useResearchProgress.ts:77-94`
   - Fix: Track completion state

---

## 5. Architecture Improvements

### 5.1 Recommended Changes

1. **Add Request Cancellation**

   - Backend: AbortController in deepResearch
   - Frontend: Cancel button triggers backend cancellation endpoint

2. **Improve Progress Buffering**

   - Buffer last N progress updates per session
   - Send buffer to late-connecting SSE clients

3. **Add Persistence Layer**

   - Current: In-memory sessions (lost on restart)
   - Recommended: Redis or database for session storage

4. **Add WebSocket Alternative**

   - SSE is one-way only
   - WebSocket allows bidirectional communication
   - Better for cancellation signals

5. **Implement Proper Error Boundaries**
   - Frontend needs error boundaries around chat components
   - Backend needs better error categorization

---

## 6. Performance Concerns

1. **Concurrent Research Limit**

   - Current: No limit on concurrent research sessions
   - Recommendation: Add queue system with max concurrent limit

2. **Memory Usage**

   - Sessions stored in memory indefinitely (until 24h expiry)
   - Large reports can consume significant memory
   - Recommendation: Stream reports to storage, keep references only

3. **SSE Connection Scaling**
   - Each session can have multiple SSE connections
   - No limit on connections per session
   - Recommendation: Limit to 1-2 connections per session

---

## Conclusion

The Deep Research application has a solid foundation but requires critical fixes before production use:

**Must Fix:**

- Infinite re-render loop (Issue 2.1)
- Type safety issues (Issue 1.2)
- State mutations (Issue 2.2)

**Should Fix:**

- Backend cancellation (Issue 1.1)
- Memory leaks (Issue 1.3)

**Nice to Have:**

- Progress buffering (Issue 1.4)
- Better error handling
- Persistence layer

Total Issues Found: **7 critical/high, 3 medium/low**
