## Deep Research Codebase – Refactor Review and Plan

### Executive Summary

- Overall health: solid foundation with clear domain boundaries (chat, research, custom GPTs) and good typing across front/back. Primary issues stem from a few "god files" and duplicated infrastructure code.
- Top 3 issues:
  1) Excessive responsibility concentration (apps/backend/src/api.ts ~600 lines; several frontend pages/components >250–400 lines).
  2) Inconsistent API/config usage (both fetch and axios; duplicated API_URL/baseURL/endpoint constants across files).
  3) Mixed concerns in hooks/components (state + network + storage + UI in the same file) reducing testability.
- Recommended approach: strictly incremental, behavior-preserving extractions. Start by consolidating configuration and API clients, then split large files into cohesive modules. Add minimal tests around extracted seams before further changes.
- Expected benefits (quantified targets):
  - 30–50% reduction in lines per god file by extraction
  - 20–30% faster onboarding (clear module boundaries)
  - +15–25% unit test coverage on critical flows (upload, chat stream, research)
  - Fewer regressions via shared config and typed clients

### Refactor Readiness Assessment (selected key files)

- Backend
  - apps/backend/src/api.ts (603): God file (routing + validation + SSE + transformation). Ready for split into routers/services. Risk: Medium.
  - apps/backend/src/deep-research.ts (318): Core logic is cohesive; add env-driven timeouts/retries and backoff. Risk: Medium-Low.
  - apps/backend/src/file-processor.ts (283): Cohesive; move constants to config; add unit tests; keep API. Risk: Low.
  - apps/backend/src/middleware.ts (156): Good; consider generic validateBody typing and env-driven rate limits/CORS. Risk: Low.
  - apps/backend/src/ai/providers.ts (377): Good provider abstraction; expose RECOMMENDED_MODELS via shared package; add structured logging. Risk: Low.
  - apps/backend/src/session-manager.ts (138): Good. Consider extracting SSE coupling out of api.ts into a small module. Risk: Low.
- Frontend
  - apps/web/app/custom-gpts/new/page.tsx (424) and [id]/page.tsx (410): Overlong pages (forms, actions, file mgmt). Extract subcomponents + form schema. Risk: Medium.
  - apps/web/components/chat/ChatInput.tsx (281): UI + upload networking in one. Extract useFileUploads and use apiClient/config. Risk: Low.
  - apps/web/components/chat/ChatMessage.tsx (249): Solid; ReactMarkdown without raw HTML is safe. Risk: Low.
  - apps/web/components/ChatSidebar.tsx (245): Solid; persist collapsed state to localStorage; optional search debounce. Risk: Low.
  - apps/web/app/research/page.tsx (227): Orchestrates sessions/modes; fine; keep thin by pushing session/message restore into hooks. Risk: Low.
  - apps/web/hooks/useCustomGPTs.ts (262): Two hooks in one file; split into useCustomGPTs.ts and useActiveCustomGPT.ts; use a shared API layer (axios). Risk: Low.
  - apps/web/hooks/useSimpleChat.ts (193): Good streaming logic; extract SSE parsing to util. Risk: Low.
  - apps/web/hooks/useChat.ts (287): Good research orchestration; add tests for progress → thinking mapping. Risk: Low.
  - apps/web/lib/api/custom-gpts.ts (221): Uses fetch and duplicates API base; convert to apiClient and shared constants. Risk: Low.
  - apps/web/lib/api-client.ts (26) + apps/web/lib/constants.ts (26): Duplicate API_URL definitions; centralize. Risk: Low.
  - apps/web/lib/db.ts (275): IndexedDB wrapper for multiple stores; acceptable; consider per-store modules or typed helpers later. Risk: Low-Medium.

### Proposed Module Structure (Before → After)

- Backend
  - Before: api.ts (routes+controllers+SSE), deep-research.ts, file-processor.ts, middleware.ts, ai/providers.ts, session-manager.ts
  - After:
    - src/routes/
      - chat.routes.ts, research.routes.ts, upload.routes.ts, history.routes.ts
    - src/controllers/
      - chat.controller.ts, research.controller.ts, upload.controller.ts
    - src/services/
      - research.service.ts (wraps deep-research + writeFinalReport),
      - sse.service.ts (client registry + sendProgressUpdate),
      - file.service.ts (thin wrapper over file-processor),
      - llm.service.ts (provider info/helpers)
    - src/schemas/ (zod schemas)
    - Keep existing ai/, middleware/, session-manager.ts
- Frontend
  - lib/config.ts: single source for API_URL and endpoints
  - lib/api/: axios-based clients (custom-gpts.client.ts, files.client.ts)
  - hooks/: split useActiveCustomGPT into its own file; add useFileUploads
  - components/custom-gpts/: CustomGPTForm, ModelSettingsSelector, CapabilitiesEditor, KnowledgeFilesList
  - lib/sse.ts: shared SSE line parser for streaming chat

### Incremental Refactor Plan (each <2h; behavior-preserving)

1) Frontend config consolidation (Low):
   - Create lib/config.ts exporting API_URL and endpoints; switch api-client.ts to import it; update custom-gpts.ts and ChatInput.tsx to consume API_URL from config.
   - Add quick unit test for config shape.
2) Unify HTTP client (Low):
   - Convert lib/api/custom-gpts.ts to use apiClient (axios) and shared endpoints.
   - Keep function signatures intact.
3) Extract useActiveCustomGPT (Low):
   - Move from useCustomGPTs.ts into hooks/useActiveCustomGPT.ts; re-export from index to avoid import churn.
   - No behavior change.
4) ChatInput upload extraction (Low):
   - Create hooks/useFileUploads.ts (select, POST /upload, error handling). Component only renders UI.
   - Use API_URL from config; add file-count guard to match backend limits.
5) Persist ChatSidebar collapsed state (Low):
   - Read/write a boolean in localStorage; default false. No API impact.
6) Backend route split (Medium):
   - Create routes/upload.routes.ts and chat.routes.ts; move corresponding handlers from api.ts; wire in app.use().
   - No logic changes; keep middleware & schemas as-is.
7) Extract zod schemas (Low):
   - Move researchSchema and chatSchema to src/schemas; import in routes. Improves reuse.
8) SSE service (Low):
   - Extract sseClients map and sendProgressUpdate into src/services/sse.service.ts; use in research route.
9) Deep-research resiliency (Medium):
   - Add env-configurable timeouts (SEARCH_TIMEOUT_MS, GENERATE_TIMEOUT_MS) and simple retry (1–2 retries on Timeout) with backoff; preserve defaults.
10) Custom GPT pages decomposition (Medium):

- Extract form sections to components/custom-gpts/* and a zod form schema. Keep page-level data flow.

11) Share model recommendations (Medium):

- Move RECOMMENDED_MODELS (backend) to packages/types or packages/config; import from both FE/BE to avoid drift.

12) Tests – backend critical paths (Medium):

- Add supertest-based tests for /health, /upload (pdf/txt), /chat (mock model, stream), /research (mock deep-research).

13) Tests – frontend hooks/components (Medium):

- Vitest+RTL: useSimpleChat streaming parse, useChat progress mapping, ChatSidebar interactions, useFileUploads error paths.

14) Linting/CI (Low):

- Ensure ESLint/Prettier rules enforce import from lib/config, no fetch in API clients, and max-LOC warnings for components.

### File-by-File Recommendations (high-signal)

- apps/backend/src/api.ts
  - Split into routers/controllers (see steps 6–8). Move SSE map + sender to service. Reuse validateBody from schemas.
- apps/backend/src/deep-research.ts
  - Make ConcurrencyLimit, Firecrawl timeout, generateObject timeout env-driven; add retry/backoff on Timeout; log with request IDs if available.
- apps/backend/src/file-processor.ts
  - Export size/type limits from a config; add tests for validateFile and doc extraction; consider streaming parse for large PDFs later.
- apps/backend/src/middleware.ts
  - Extract cors allowed origins to env list; make researchRateLimiter limits env-driven; type validateBody<T> to inject parsed body.
- apps/backend/src/ai/providers.ts
  - Move RECOMMENDED_MODELS to shared package; reduce console.log noise behind NODE_ENV or a debug logger.
- apps/backend/src/session-manager.ts
  - Keep; optional: expose TTL as env; add lightweight unit tests.
- apps/web/lib/constants.ts + lib/api-client.ts + lib/api/custom-gpts.ts + components/chat/ChatInput.tsx
  - Remove duplicated API_URL string literals. Import from lib/config.ts only.
- apps/web/hooks/useCustomGPTs.ts
  - Split into two files; in useCustomGPTs rely on apiClient; leave IndexedDB sync path intact.
- apps/web/hooks/useSimpleChat.ts
  - Extract SSE line parsing to lib/sse.ts; add guard for malformed lines (already handled) and unit tests.
- apps/web/components/chat/ChatInput.tsx
  - Extract upload logic to hook; add file-count check (<=5) with user feedback to match backend; report per-file validation errors.
- apps/web/app/custom-gpts/new/page.tsx & [id]/page.tsx
  - Extract: CustomGPTForm, KnowledgeFilesList, ModelSettingsSelector, ConversationStartersEditor; define a zod schema shared between new/edit; use react-hook-form for field registration.
- apps/web/app/research/page.tsx
  - Keep orchestration thin; consider persisting mode in localStorage.

### Quick Wins (low risk, high ROI)

- Replace hardcoded API_URL usages in ChatInput.tsx and lib/api/custom-gpts.ts with lib/config.ts.
- Persist ChatSidebar collapsed state in localStorage.
- Make rate limits (global and research) env-configurable; default to current values.
- Add a simple retry/backoff for Firecrawl timeouts in deep-research.ts.
- Export and reuse a single RECOMMENDED_MODELS list from shared package to power FE forms and BE provider hints.

### Testing Strategy

- Backend (supertest + vitest/jest):
  - /health returns ok
  - /upload accepts txt/pdf, rejects >10MB or wrong types; asserts extractedText populated for docs
  - /chat streams SSE: mock model to emit a few chunks; verify client parsing
  - /research: stub deepResearch to emit progress then completion; verify SSE via sse.service
- Frontend (vitest + React Testing Library):
  - useSimpleChat: mock fetch stream; ensure accumulated content and done handling
  - useChat: map ResearchProgress → thinking steps; final report applied
  - ChatSidebar: select/delete/persist collapsed state
  - useFileUploads: happy path + error surfaces to UI
- Add a minimal CI step to run type-check + tests. No server/dev server runs required by default.

### Risks and Mitigations

- Split-induced import churn (Low): use barrel files and re-exports to minimize diff.
- Streaming regressions (Low): keep SSE parser identical, just moved to util with tests.
- Route split (Medium): migrate handlers one-by-one with identical schemas and middleware order; integration test after.
- Config drift (Low): enforce imports from lib/config via ESLint rule.

### Conclusion

Follow the 14-step plan in order. Steps 1–5 are same-day quick wins. Steps 6–11 spread over subsequent sessions, each independently shippable. Add tests in steps 12–13 to lock behavior before deeper changes. The result will be clearer boundaries, easier testing, and safer evolution without altering user-facing behavior.
