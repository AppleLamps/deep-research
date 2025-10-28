# Custom GPT Builder - Design Document

**Version:** 1.0  
**Date:** 2025-10-28  
**Status:** Design Phase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Architecture Analysis](#current-architecture-analysis)
3. [Feature Requirements](#feature-requirements)
4. [Data Model Design](#data-model-design)
5. [Architecture Design](#architecture-design)
6. [API Design](#api-design)
7. [Frontend Design](#frontend-design)
8. [Knowledge Base Processing](#knowledge-base-processing)
9. [Security & Validation](#security--validation)
10. [Implementation Plan](#implementation-plan)

---

## Executive Summary

The Custom GPT Builder feature will allow users to create personalized AI assistants with:
- **Custom system instructions** (behavior/personality)
- **Custom knowledge base** (uploaded documents)
- **Custom settings** (model selection, temperature, etc.)
- **Conversation starters** (predefined prompts)

This feature will integrate seamlessly with both **Research Mode** and **Chat Mode**, allowing users to switch between different custom GPTs for different use cases.

---

## Current Architecture Analysis

### Existing Components

1. **LLM Provider System** (`apps/backend/src/ai/providers.ts`)
   - Supports multiple providers: OpenAI, Fireworks, OpenRouter, Custom
   - Model override capability via `getModel(provider, model)`
   - Centralized configuration management

2. **Prompt System** (`apps/backend/src/prompt.ts`)
   - Simple function returning system prompt
   - Currently hardcoded for research tasks
   - Easy to extend with custom instructions

3. **File Processing** (`apps/backend/src/file-processor.ts`)
   - Supports images (JPEG, PNG, GIF, WebP)
   - Supports documents (PDF, TXT, MD, DOC, DOCX)
   - Text extraction from documents
   - Image analysis with vision models
   - 10MB file size limit

4. **Session Management** (`apps/backend/src/session-manager.ts`)
   - In-memory session storage
   - 24-hour expiry
   - Tracks research progress and results

5. **Database** (`apps/web/lib/db.ts`)
   - IndexedDB for client-side storage
   - Stores research results
   - Offline queue support

### Integration Points

- **API Layer**: Express.js with Zod validation
- **Frontend**: Next.js 16 with React 19
- **State Management**: React hooks + IndexedDB
- **File Uploads**: Multer middleware
- **Real-time Updates**: Server-Sent Events (SSE)

---

## Feature Requirements

### Functional Requirements

1. **Custom GPT Creation**
   - Name and description
   - Custom system instructions (prompt)
   - Upload knowledge files (documents)
   - Select recommended model
   - Add conversation starters
   - Set capabilities (web search, file analysis)

2. **Custom GPT Management**
   - List all custom GPTs
   - Edit existing custom GPTs
   - Delete custom GPTs
   - Duplicate custom GPTs
   - Export/Import custom GPT configurations

3. **Custom GPT Usage**
   - Select active custom GPT for chat
   - Select active custom GPT for research
   - Switch between custom GPTs mid-conversation
   - View custom GPT details during use

4. **Knowledge Base**
   - Upload multiple documents per custom GPT
   - Extract and index text from documents
   - Retrieve relevant context during conversations
   - Manage (add/remove) knowledge files

### Non-Functional Requirements

1. **Performance**
   - Fast knowledge base retrieval (<500ms)
   - Efficient text chunking and embedding
   - Minimal impact on existing features

2. **Storage**
   - Client-side: IndexedDB for custom GPT configs
   - Server-side: File system for knowledge files
   - Max 50MB total knowledge per custom GPT

3. **Security**
   - File type validation
   - Content sanitization
   - User isolation (future: multi-user support)
   - Rate limiting on uploads

4. **Usability**
   - Intuitive UI similar to ChatGPT's builder
   - Drag-and-drop file uploads
   - Live preview of custom GPT
   - Clear error messages

---

## Data Model Design

### Custom GPT Configuration

```typescript
interface CustomGPT {
  id: string;                          // UUID
  name: string;                        // Display name
  description: string;                 // Short description
  instructions: string;                // System prompt/instructions
  conversationStarters: string[];      // Predefined prompts
  knowledgeFiles: KnowledgeFile[];     // Uploaded documents
  settings: CustomGPTSettings;         // Model & behavior settings
  capabilities: CustomGPTCapabilities; // Enabled features
  createdAt: string;                   // ISO timestamp
  updatedAt: string;                   // ISO timestamp
  avatar?: string;                     // Optional avatar URL/emoji
}

interface CustomGPTSettings {
  recommendedModel?: {
    provider: LLMProvider;
    model: string;
  };
  temperature?: number;                // 0-2, default 1
  maxTokens?: number;                  // Max response length
  topP?: number;                       // Nucleus sampling
}

interface CustomGPTCapabilities {
  webSearch: boolean;                  // Enable Firecrawl search
  fileAnalysis: boolean;               // Enable file uploads in chat
  imageGeneration: boolean;            // Future: DALL-E integration
  codeInterpreter: boolean;            // Future: code execution
}

interface KnowledgeFile {
  id: string;                          // UUID
  name: string;                        // Original filename
  size: number;                        // File size in bytes
  mimeType: string;                    // MIME type
  uploadedAt: string;                  // ISO timestamp
  storagePath: string;                 // Server file path
  extractedText?: string;              // Extracted text content
  chunks?: TextChunk[];                // Chunked text for retrieval
  processingStatus: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;                      // Processing error message
}

interface TextChunk {
  id: string;                          // UUID
  text: string;                        // Chunk content
  startIndex: number;                  // Start position in original
  endIndex: number;                    // End position in original
  embedding?: number[];                // Future: vector embedding
}
```

### Database Schema (IndexedDB)

```typescript
// Store: custom_gpts
{
  keyPath: "id",
  indexes: [
    { name: "createdAt", unique: false },
    { name: "updatedAt", unique: false },
    { name: "name", unique: false }
  ]
}

// Store: knowledge_files
{
  keyPath: "id",
  indexes: [
    { name: "customGptId", unique: false },
    { name: "uploadedAt", unique: false }
  ]
}

// Store: active_custom_gpt
{
  keyPath: "mode", // 'chat' or 'research'
  value: customGptId
}
```

---

## Architecture Design

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Custom GPT   │  │ Custom GPT   │  │ Chat/Research│      │
│  │ Builder UI   │  │ Selector     │  │ Interface    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│  ┌──────▼──────────────────▼──────────────────▼───────┐    │
│  │         Custom GPT Manager (React Hook)            │    │
│  └──────┬──────────────────┬──────────────────┬───────┘    │
│         │                  │                  │              │
│  ┌──────▼───────┐   ┌──────▼───────┐   ┌─────▼──────┐     │
│  │  IndexedDB   │   │  API Client  │   │ File Upload│     │
│  │  (Storage)   │   │              │   │  Handler   │     │
│  └──────────────┘   └──────┬───────┘   └────────────┘     │
└─────────────────────────────┼──────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   API Gateway     │
                    │  (Express.js)     │
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐  ┌─────────▼────────┐  ┌────────▼────────┐
│ Custom GPT     │  │ Knowledge Base   │  │ LLM Provider    │
│ Service        │  │ Processor        │  │ Integration     │
└───────┬────────┘  └─────────┬────────┘  └────────┬────────┘
        │                     │                     │
┌───────▼────────┐  ┌─────────▼────────┐  ┌────────▼────────┐
│ File System    │  │ Text Chunker     │  │ OpenAI/Fireworks│
│ (Knowledge)    │  │ & Retriever      │  │ /OpenRouter     │
└────────────────┘  └──────────────────┘  └─────────────────┘
```

### Component Responsibilities

1. **Custom GPT Builder UI**
   - Form for creating/editing custom GPTs
   - File upload interface
   - Live preview panel
   - Validation and error handling

2. **Custom GPT Selector**
   - Dropdown/modal to select active custom GPT
   - Display custom GPT details
   - Quick switch between custom GPTs

3. **Custom GPT Manager (Hook)**
   - CRUD operations for custom GPTs
   - IndexedDB persistence
   - API communication
   - State management

4. **Custom GPT Service (Backend)**
   - Business logic for custom GPT operations
   - File storage management
   - Knowledge base indexing
   - Integration with LLM providers

5. **Knowledge Base Processor**
   - Text extraction from documents
   - Text chunking (RecursiveCharacterTextSplitter)
   - Context retrieval during conversations
   - Future: Vector embeddings for semantic search

---

## API Design

### Endpoints

```typescript
// Custom GPT CRUD
POST   /api/custom-gpts              // Create custom GPT
GET    /api/custom-gpts              // List all custom GPTs
GET    /api/custom-gpts/:id          // Get custom GPT by ID
PUT    /api/custom-gpts/:id          // Update custom GPT
DELETE /api/custom-gpts/:id          // Delete custom GPT
POST   /api/custom-gpts/:id/duplicate // Duplicate custom GPT

// Knowledge Base Management
POST   /api/custom-gpts/:id/knowledge        // Upload knowledge file
GET    /api/custom-gpts/:id/knowledge        // List knowledge files
DELETE /api/custom-gpts/:id/knowledge/:fileId // Delete knowledge file
POST   /api/custom-gpts/:id/knowledge/process // Reprocess all files

// Custom GPT Usage
POST   /api/chat/custom-gpt          // Chat with custom GPT
POST   /api/research/custom-gpt      // Research with custom GPT
GET    /api/custom-gpts/:id/context  // Get relevant context for query

// Import/Export
POST   /api/custom-gpts/import       // Import custom GPT config
GET    /api/custom-gpts/:id/export   // Export custom GPT config
```

### Request/Response Examples

#### Create Custom GPT

```typescript
// POST /api/custom-gpts
Request:
{
  "name": "Research Assistant",
  "description": "Specialized in academic research",
  "instructions": "You are an expert research assistant...",
  "conversationStarters": [
    "Help me research a topic",
    "Summarize this paper"
  ],
  "settings": {
    "recommendedModel": {
      "provider": "openai",
      "model": "gpt-4o"
    },
    "temperature": 0.7
  },
  "capabilities": {
    "webSearch": true,
    "fileAnalysis": true
  }
}

Response:
{
  "success": true,
  "data": {
    "id": "custom-gpt-uuid",
    "name": "Research Assistant",
    ...
    "createdAt": "2025-10-28T...",
    "updatedAt": "2025-10-28T..."
  }
}
```

#### Upload Knowledge File

```typescript
// POST /api/custom-gpts/:id/knowledge
Request: multipart/form-data
{
  file: <binary>,
  metadata: {
    "description": "Company handbook"
  }
}

Response:
{
  "success": true,
  "data": {
    "id": "file-uuid",
    "name": "handbook.pdf",
    "size": 1024000,
    "processingStatus": "processing",
    ...
  }
}
```

---

## Frontend Design

### UI Components

1. **Custom GPT Builder Page** (`/custom-gpts/new`, `/custom-gpts/:id/edit`)
   - Two-column layout (Configure | Preview)
   - Form sections:
     - Basic Info (name, description, avatar)
     - Instructions (textarea with markdown support)
     - Conversation Starters (list input)
     - Knowledge (file upload area)
     - Settings (model selector, temperature slider)
     - Capabilities (checkboxes)
   - Live preview panel showing how GPT will appear

2. **Custom GPT List Page** (`/custom-gpts`)
   - Grid/list view of all custom GPTs
   - Search and filter
   - Quick actions (edit, duplicate, delete)
   - Create new button

3. **Custom GPT Selector Component**
   - Dropdown in chat/research interface
   - Shows active custom GPT
   - Quick switch menu
   - "Create new" option

4. **Knowledge File Manager**
   - Drag-and-drop upload area
   - File list with status indicators
   - Processing progress
   - Delete/reprocess actions

### User Flow

```
1. User clicks "Create Custom GPT"
   ↓
2. Fill in basic info (name, description)
   ↓
3. Write custom instructions
   ↓
4. Upload knowledge files (optional)
   ↓
5. Configure settings (model, temperature)
   ↓
6. Add conversation starters (optional)
   ↓
7. Preview and test
   ↓
8. Save custom GPT
   ↓
9. Select custom GPT in chat/research
   ↓
10. Start conversation with custom context
```

---

## Knowledge Base Processing

### Text Extraction Pipeline

```
1. File Upload
   ↓
2. Validate file type and size
   ↓
3. Extract text (PDF/DOCX/TXT)
   ↓
4. Chunk text (RecursiveCharacterTextSplitter)
   - Chunk size: 1000 characters
   - Overlap: 200 characters
   ↓
5. Store chunks with metadata
   ↓
6. (Future) Generate embeddings
   ↓
7. Index for retrieval
```

### Context Retrieval Strategy

**Simple Approach (Phase 1):**
- Concatenate all knowledge file text
- Trim to fit context window
- Prepend to system prompt

**Advanced Approach (Phase 2 - Future):**
- Generate embeddings for chunks
- Semantic search based on user query
- Retrieve top-k relevant chunks
- Inject into system prompt

### Example Integration

```typescript
// When user sends message with custom GPT active
const customGpt = await getCustomGPT(customGptId);
const relevantContext = await getRelevantContext(
  customGpt.knowledgeFiles,
  userMessage
);

const systemPrompt = `${customGpt.instructions}

## Knowledge Base Context
${relevantContext}

## Instructions
Use the above knowledge base to answer questions accurately.
If the answer is not in the knowledge base, say so.`;

// Send to LLM with custom system prompt
const response = await generateText({
  model: getModel(
    customGpt.settings.recommendedModel?.provider,
    customGpt.settings.recommendedModel?.model
  ),
  system: systemPrompt,
  messages: [...conversationHistory, userMessage],
  temperature: customGpt.settings.temperature
});
```

---

## Security & Validation

### File Upload Security

1. **File Type Validation**
   - Whitelist: PDF, TXT, MD, DOC, DOCX
   - Magic number verification (not just extension)
   - Reject executable files

2. **File Size Limits**
   - Per file: 10MB
   - Total per custom GPT: 50MB
   - Enforce on both client and server

3. **Content Sanitization**
   - Strip malicious scripts from extracted text
   - Validate UTF-8 encoding
   - Remove null bytes

4. **Rate Limiting**
   - Max 10 file uploads per minute
   - Max 5 custom GPTs created per hour
   - Prevent abuse

### Data Validation

```typescript
// Zod schemas for validation
const customGPTSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  instructions: z.string().min(10).max(10000),
  conversationStarters: z.array(z.string().max(200)).max(10),
  settings: z.object({
    recommendedModel: z.object({
      provider: z.enum(['openai', 'fireworks', 'openrouter', 'custom']),
      model: z.string()
    }).optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().int().min(1).max(100000).optional()
  }),
  capabilities: z.object({
    webSearch: z.boolean(),
    fileAnalysis: z.boolean()
  })
});
```

### User Isolation (Future)

- Associate custom GPTs with user IDs
- Implement authentication middleware
- Enforce access control on all endpoints
- Separate storage per user

---

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1)

**Backend:**
- [ ] Create Custom GPT data models (TypeScript types)
- [ ] Implement Custom GPT service class
- [ ] Add API endpoints for CRUD operations
- [ ] Implement knowledge file upload endpoint
- [ ] Add text extraction and chunking logic
- [ ] Update prompt system to support custom instructions

**Frontend:**
- [ ] Create IndexedDB schema for custom GPTs
- [ ] Implement `useCustomGPTs` hook for state management
- [ ] Create API client functions
- [ ] Add custom GPT types to shared package

### Phase 2: UI Development (Week 2)

**Frontend:**
- [ ] Build Custom GPT Builder page
- [ ] Create Custom GPT list page
- [ ] Implement Custom GPT selector component
- [ ] Add knowledge file upload UI
- [ ] Create live preview panel
- [ ] Add form validation and error handling

### Phase 3: Integration (Week 3)

**Backend:**
- [ ] Integrate custom GPT with chat endpoint
- [ ] Integrate custom GPT with research endpoint
- [ ] Implement context retrieval logic
- [ ] Add knowledge base processing queue

**Frontend:**
- [ ] Connect chat interface to custom GPT selector
- [ ] Connect research interface to custom GPT selector
- [ ] Add custom GPT indicator in conversations
- [ ] Implement conversation starters UI

### Phase 4: Polish & Testing (Week 4)

- [ ] Add import/export functionality
- [ ] Implement duplicate custom GPT feature
- [ ] Add comprehensive error handling
- [ ] Write unit tests for backend services
- [ ] Write integration tests for API endpoints
- [ ] Perform end-to-end testing
- [ ] Optimize performance (caching, lazy loading)
- [ ] Write user documentation

### Phase 5: Future Enhancements

- [ ] Vector embeddings for semantic search
- [ ] Multi-user support with authentication
- [ ] Custom GPT marketplace/sharing
- [ ] Advanced capabilities (code interpreter, image generation)
- [ ] Analytics and usage tracking
- [ ] A/B testing different instructions
- [ ] Version control for custom GPTs

---

## Success Metrics

1. **Functionality**
   - Users can create custom GPTs in <5 minutes
   - Knowledge base retrieval accuracy >80%
   - Zero data loss or corruption

2. **Performance**
   - Custom GPT creation <2 seconds
   - Knowledge file processing <10 seconds per MB
   - Context retrieval <500ms

3. **Usability**
   - User satisfaction score >4/5
   - <5% error rate in custom GPT creation
   - Clear error messages for all failures

4. **Adoption**
   - 50% of users create at least one custom GPT
   - Average 3 custom GPTs per active user
   - 70% of conversations use custom GPTs

---

## Conclusion

This design provides a comprehensive foundation for implementing a ChatGPT-style Custom GPT Builder in the Deep Research application. The architecture leverages existing infrastructure while adding new capabilities for personalization and knowledge management.

The phased implementation approach ensures incremental delivery of value while maintaining system stability. Future enhancements will add advanced features like semantic search and multi-user support.

**Next Steps:**
1. Review and approve this design document
2. Begin Phase 1 implementation
3. Set up project tracking and milestones
4. Schedule regular progress reviews

