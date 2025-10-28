import cors from 'cors';
import express, { Request, Response } from 'express';
import multer from 'multer';
import type { ResearchQuery, ResearchResult, ResearchProgress, FileAttachment, CreateCustomGPTRequest, UpdateCustomGPTRequest } from '@deep-research/types';
import { z } from 'zod';

import { getProviderInfo, getModel } from './ai/providers';
import { deepResearch, writeFinalReport } from './deep-research';
import { sessionManager } from './session-manager';
import { customGPTService } from './custom-gpt-service';
import { streamText } from 'ai';
import {
  validateFile,
  extractTextFromDocument,
  analyzeImage,
  saveFile,
  generateUniqueFilename,
} from './file-processor';
import {
  requestIdMiddleware,
  requestLogger,
  rateLimiter,
  researchRateLimiter,
  errorHandler,
  notFoundHandler,
  validateBody,
  corsOptions,
} from './middleware';

const app = express();
const port = process.env.PORT || 3051;

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5, // Max 5 files per request
  },
});

// Middleware - Order matters!
app.use(requestIdMiddleware); // Add request ID first
app.use(cors(corsOptions)); // CORS with proper configuration
app.use(express.json({ limit: '10mb' })); // Body parser with size limit
app.use(requestLogger); // Request logging
app.use(rateLimiter); // Global rate limiting

// Helper function for consistent logging
function log(...args: any[]) {
  console.log(...args);
}

// SSE clients map
const sseClients = new Map<string, Response[]>();

// Validation schemas
const researchSchema = z.object({
  query: z.string().min(1).max(1000),
  breadth: z.number().int().min(2).max(10).default(5),
  depth: z.number().int().min(1).max(5).default(3),
  llmConfig: z.object({
    provider: z.enum(['openai', 'fireworks', 'openrouter', 'custom']).optional(),
    model: z.string().optional(),
  }).optional(),
  customGptId: z.string().optional(),
});

const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
    attachments: z.array(z.object({
      id: z.string(),
      name: z.string(),
      size: z.number(),
      type: z.enum(['image', 'document']),
      mimeType: z.string(),
      url: z.string(),
      extractedText: z.string().optional(),
    })).optional(),
  })),
  llmConfig: z.object({
    provider: z.enum(['openai', 'fireworks', 'openrouter', 'custom']).optional(),
    model: z.string().optional(),
  }).optional(),
  customGptId: z.string().optional(),
});

const createCustomGPTSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  instructions: z.string().min(10).max(10000),
  conversationStarters: z.array(z.string().max(200)).max(10).optional(),
  settings: z.object({
    recommendedModel: z.object({
      provider: z.enum(['openai', 'fireworks', 'openrouter', 'custom']),
      model: z.string(),
    }).optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().int().min(1).max(100000).optional(),
    topP: z.number().min(0).max(1).optional(),
  }).optional(),
  capabilities: z.object({
    webSearch: z.boolean().optional(),
    fileAnalysis: z.boolean().optional(),
    imageGeneration: z.boolean().optional(),
    codeInterpreter: z.boolean().optional(),
  }).optional(),
  avatar: z.string().optional(),
});

const updateCustomGPTSchema = createCustomGPTSchema.partial();

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// File upload endpoint
app.post(
  '/upload',
  upload.array('files', 5),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({
          error: 'No files uploaded',
          requestId: req.requestId,
        });
      }

      const processedFiles: FileAttachment[] = [];
      const errors: string[] = [];

      for (const file of files) {
        try {
          // Validate file
          const validation = await validateFile(
            file.buffer,
            file.originalname,
            file.size
          );

          if (!validation.valid) {
            errors.push(`${file.originalname}: ${validation.error}`);
            continue;
          }

          // Generate unique filename
          const uniqueFilename = generateUniqueFilename(file.originalname);

          // Save file to disk
          const filepath = await saveFile(file.buffer, uniqueFilename);

          // Create file URL (relative to server)
          const fileUrl = `/uploads/${uniqueFilename}`;

          // Process based on file type
          let extractedText: string | undefined;

          if (validation.fileType === 'document') {
            try {
              extractedText = await extractTextFromDocument(
                file.buffer,
                validation.mimeType!
              );
            } catch (error) {
              console.error('Error extracting text:', error);
              errors.push(`${file.originalname}: Failed to extract text`);
              continue;
            }
          }

          // Create file attachment object
          const attachment: FileAttachment = {
            id: uniqueFilename,
            name: file.originalname,
            size: file.size,
            type: validation.fileType!,
            mimeType: validation.mimeType!,
            url: fileUrl,
            extractedText,
          };

          processedFiles.push(attachment);
        } catch (error: any) {
          console.error(`Error processing file ${file.originalname}:`, error);
          errors.push(`${file.originalname}: ${error.message}`);
        }
      }

      if (processedFiles.length === 0) {
        return res.status(400).json({
          error: 'No files were successfully processed',
          details: errors,
          requestId: req.requestId,
        });
      }

      res.json({
        success: true,
        files: processedFiles,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error: any) {
      console.error('Error in upload endpoint:', error);
      res.status(500).json({
        error: 'File upload failed',
        message: error.message,
        requestId: req.requestId,
      });
    }
  }
);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Chat endpoint for regular LLM conversations (streaming)
app.post(
  '/chat',
  validateBody(chatSchema),
  async (req: Request, res: Response) => {
    try {
      const { messages, llmConfig, customGptId } = req.body;

      // Set headers for SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Get custom GPT if specified
      let customGPT = null;
      let customSystemPrompt = null;
      if (customGptId) {
        customGPT = await customGPTService.getCustomGPT(customGptId);
        if (customGPT) {
          // Get knowledge base context
          const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();
          const userQuery = lastUserMessage?.content || '';
          const knowledgeContext = await customGPTService.getRelevantContext(
            customGptId,
            userQuery
          );

          // Build custom system prompt
          customSystemPrompt = customGPT.instructions;
          if (knowledgeContext) {
            customSystemPrompt += `\n\n## Knowledge Base Context\n${knowledgeContext}\n\n## Instructions\nUse the above knowledge base to answer questions accurately. If the answer is not in the knowledge base, say so.`;
          }
        }
      }

      // Process messages to handle attachments
      const processedMessages = await Promise.all(
        messages.map(async (msg: any) => {
          // If message has image attachments, format for vision model
          if (msg.attachments && msg.attachments.length > 0) {
            const imageAttachments = msg.attachments.filter(
              (att: any) => att.type === 'image'
            );
            const documentAttachments = msg.attachments.filter(
              (att: any) => att.type === 'document'
            );

            // Build content array for vision model
            const content: any[] = [];

            // Add text content
            let textContent = msg.content;

            // Add extracted text from documents
            if (documentAttachments.length > 0) {
              const extractedTexts = documentAttachments
                .map((att: any) => att.extractedText)
                .filter(Boolean);
              if (extractedTexts.length > 0) {
                textContent += '\n\nAttached documents:\n' + extractedTexts.join('\n\n');
              }
            }

            content.push({ type: 'text', text: textContent });

            // Add images
            for (const img of imageAttachments) {
              // Read image file and convert to base64
              const fs = await import('fs/promises');
              const path = await import('path');
              const filepath = path.join(process.cwd(), img.url.replace(/^\//, ''));

              try {
                const buffer = await fs.readFile(filepath);
                const base64 = buffer.toString('base64');
                const dataUrl = `data:${img.mimeType};base64,${base64}`;
                content.push({ type: 'image', image: dataUrl });
              } catch (error) {
                console.error('Error reading image file:', error);
              }
            }

            return {
              role: msg.role,
              content,
            };
          }

          // No attachments, return as-is
          return {
            role: msg.role,
            content: msg.content,
          };
        })
      );

      // Get the model (with optional override)
      // For images, use vision-capable model
      const hasImages = messages.some(
        (msg: any) => msg.attachments?.some((att: any) => att.type === 'image')
      );

      let model;
      if (hasImages) {
        // Force vision-capable model for images
        model = getModel(
          llmConfig?.provider || customGPT?.settings.recommendedModel?.provider || 'openai',
          llmConfig?.model || customGPT?.settings.recommendedModel?.model || 'gpt-4o'
        );
      } else {
        model = getModel(
          llmConfig?.provider || customGPT?.settings.recommendedModel?.provider,
          llmConfig?.model || customGPT?.settings.recommendedModel?.model
        );
      }

      // Stream the response
      const streamOptions: any = {
        model,
        messages: processedMessages,
      };

      // Add custom system prompt if using custom GPT
      if (customSystemPrompt) {
        streamOptions.system = customSystemPrompt;
      }

      // Add temperature if specified
      if (customGPT?.settings.temperature !== undefined) {
        streamOptions.temperature = customGPT.settings.temperature;
      }

      const result = await streamText(streamOptions);

      // Stream to client
      for await (const chunk of result.textStream) {
        res.write(`data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`);
      }

      // Send completion event
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
    } catch (error: any) {
      log('Error in chat endpoint:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
      res.end();
    }
  }
);

// API endpoint to start research (returns sessionId immediately)
app.post(
  '/research',
  researchRateLimiter,
  validateBody(researchSchema),
  async (req: Request, res: Response) => {
    try {
      const { query, depth, breadth, llmConfig } = req.body as ResearchQuery;

      // Create session
      const sessionId = sessionManager.createSession(query, breadth, depth);

      // Log model configuration if provided
      if (llmConfig?.provider || llmConfig?.model) {
        log(`Created session ${sessionId} for query: ${query} (using ${llmConfig.provider || 'default'}/${llmConfig.model || 'default'})`);
      } else {
        log(`Created session ${sessionId} for query: ${query}`);
      }

      // Return session ID immediately
      res.json({ sessionId, status: 'pending' });

      // Start research in background
      const startTime = Date.now();
      sessionManager.updateSessionStatus(sessionId, 'running');

      deepResearch({
        query,
        breadth,
        depth,
        modelOverride: llmConfig,
        onProgress: (progress) => {
          const researchProgress: ResearchProgress = {
            sessionId,
            currentDepth: progress.currentDepth,
            totalDepth: progress.totalDepth,
            currentBreadth: progress.currentBreadth,
            totalBreadth: progress.totalBreadth,
            currentQuery: progress.currentQuery,
            totalQueries: progress.totalQueries,
            completedQueries: progress.completedQueries,
            status: 'running',
            progress: Math.round((progress.completedQueries / Math.max(progress.totalQueries, 1)) * 100),
          };
          sessionManager.updateSessionProgress(sessionId, researchProgress);
          sendProgressUpdate(sessionId, researchProgress);
        },
      })
        .then(async ({ learnings, visitedUrls }) => {
          log(`\n\nLearnings:\n\n${learnings.join('\n')}`);
          log(`\n\nVisited URLs (${visitedUrls.length}):\n\n${visitedUrls.join('\n')}`);

          const report = await writeFinalReport({
            prompt: query,
            learnings,
            visitedUrls,
            modelOverride: llmConfig,
          });

          const duration = Date.now() - startTime;
          const result: ResearchResult = {
            sessionId,
            query,
            learnings,
            visitedUrls,
            report,
            timestamp: new Date().toISOString(),
            duration,
            success: true,
          };

          sessionManager.updateSessionResult(sessionId, result);

          const finalProgress: ResearchProgress = {
            sessionId,
            currentDepth: 0,
            totalDepth: depth,
            currentBreadth: 0,
            totalBreadth: breadth,
            totalQueries: learnings.length,
            completedQueries: learnings.length,
            status: 'completed',
            progress: 100,
          };
          sendProgressUpdate(sessionId, finalProgress);

          log(`Research completed for session ${sessionId}`);
        })
        .catch((error: unknown) => {
          console.error(`Error in research for session ${sessionId}:`, error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          sessionManager.setSessionError(sessionId, errorMessage);

          const errorProgress: ResearchProgress = {
            sessionId,
            currentDepth: 0,
            totalDepth: depth,
            currentBreadth: 0,
            totalBreadth: breadth,
            totalQueries: 0,
            completedQueries: 0,
            status: 'error',
            progress: 0,
            message: errorMessage,
          };
          sendProgressUpdate(sessionId, errorProgress);
        });
    } catch (error: unknown) {
      console.error('Error creating research session:', error);
      return res.status(500).json({
        error: 'An error occurred creating research session',
        message: error instanceof Error ? error.message : String(error),
        requestId: req.requestId,
      });
    }
  },
);

// Get session result
app.get('/session/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = sessionManager.getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }

    if (session.status === 'completed' && session.result) {
      return res.json(session.result);
    }

    return res.json({
      sessionId,
      status: session.status,
      progress: session.progress,
    });
  } catch (error: unknown) {
    console.error('Error getting session:', error);
    return res.status(500).json({
      error: 'An error occurred getting session',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

// SSE endpoint for progress updates
app.get('/progress/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Add client to map
  if (!sseClients.has(sessionId)) {
    sseClients.set(sessionId, []);
  }
  sseClients.get(sessionId)!.push(res);

  log(`SSE client connected for session ${sessionId}`);

  // Send initial progress if available
  const session = sessionManager.getSession(sessionId);
  if (session?.progress) {
    res.write(`data: ${JSON.stringify(session.progress)}\n\n`);
  }

  // Handle client disconnect
  req.on('close', () => {
    const clients = sseClients.get(sessionId);
    if (clients) {
      const index = clients.indexOf(res);
      if (index !== -1) {
        clients.splice(index, 1);
      }
      if (clients.length === 0) {
        sseClients.delete(sessionId);
      }
    }
    log(`SSE client disconnected for session ${sessionId}`);
  });
});

// Helper function to send progress updates to SSE clients
function sendProgressUpdate(sessionId: string, progress: ResearchProgress) {
  const clients = sseClients.get(sessionId);
  if (!clients || clients.length === 0) return;

  const data = `data: ${JSON.stringify(progress)}\n\n`;
  const deadClients: Response[] = [];

  clients.forEach(client => {
    try {
      client.write(data);
    } catch (error) {
      console.error('Error sending SSE update:', error);
      deadClients.push(client);
    }
  });

  // Remove dead clients to prevent memory leak
  if (deadClients.length > 0) {
    const remaining = clients.filter(c => !deadClients.includes(c));
    if (remaining.length === 0) {
      sseClients.delete(sessionId);
      log(`Removed all dead SSE clients for session ${sessionId}`);
    } else {
      sseClients.set(sessionId, remaining);
      log(`Removed ${deadClients.length} dead SSE clients for session ${sessionId}`);
    }
  }
}

// Get all sessions (for history)
app.get('/history', (req: Request, res: Response) => {
  try {
    const sessions = sessionManager.getAllSessions();
    const results = sessions
      .filter(s => s.result)
      .map(s => s.result)
      .sort((a, b) => new Date(b!.timestamp).getTime() - new Date(a!.timestamp).getTime());

    return res.json(results);
  } catch (error: unknown) {
    console.error('Error getting history:', error);
    return res.status(500).json({
      error: 'An error occurred getting history',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

// Delete session from history
app.delete('/history/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const deleted = sessionManager.deleteSession(sessionId);

    if (!deleted) {
      return res.status(404).json({ error: 'Session not found' });
    }

    return res.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting session:', error);
    return res.status(500).json({
      error: 'An error occurred deleting session',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

// Clear all history
app.delete('/history', (req: Request, res: Response) => {
  try {
    const sessions = sessionManager.getAllSessions();
    sessions.forEach(s => sessionManager.deleteSession(s.sessionId));

    return res.json({ success: true, deleted: sessions.length });
  } catch (error: unknown) {
    console.error('Error clearing history:', error);
    return res.status(500).json({
      error: 'An error occurred clearing history',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

// ===================================
// Custom GPT Endpoints
// ===================================

// Create a new custom GPT
app.post(
  '/custom-gpts',
  validateBody(createCustomGPTSchema),
  async (req: Request, res: Response) => {
    try {
      const customGPT = await customGPTService.createCustomGPT(req.body);
      res.json({ success: true, data: customGPT });
    } catch (error: any) {
      console.error('Error creating custom GPT:', error);
      res.status(500).json({
        error: 'Failed to create custom GPT',
        message: error.message,
      });
    }
  }
);

// Get all custom GPTs
app.get('/custom-gpts', async (req: Request, res: Response) => {
  try {
    const customGPTs = await customGPTService.getAllCustomGPTs();
    res.json({ success: true, data: customGPTs });
  } catch (error: any) {
    console.error('Error fetching custom GPTs:', error);
    res.status(500).json({
      error: 'Failed to fetch custom GPTs',
      message: error.message,
    });
  }
});

// Get a custom GPT by ID
app.get('/custom-gpts/:id', async (req: Request, res: Response) => {
  try {
    const customGPT = await customGPTService.getCustomGPT(req.params.id);
    if (!customGPT) {
      return res.status(404).json({
        error: 'Custom GPT not found',
      });
    }
    res.json({ success: true, data: customGPT });
  } catch (error: any) {
    console.error('Error fetching custom GPT:', error);
    res.status(500).json({
      error: 'Failed to fetch custom GPT',
      message: error.message,
    });
  }
});

// Update a custom GPT
app.put(
  '/custom-gpts/:id',
  validateBody(updateCustomGPTSchema),
  async (req: Request, res: Response) => {
    try {
      const customGPT = await customGPTService.updateCustomGPT(
        req.params.id,
        req.body
      );
      if (!customGPT) {
        return res.status(404).json({
          error: 'Custom GPT not found',
        });
      }
      res.json({ success: true, data: customGPT });
    } catch (error: any) {
      console.error('Error updating custom GPT:', error);
      res.status(500).json({
        error: 'Failed to update custom GPT',
        message: error.message,
      });
    }
  }
);

// Delete a custom GPT
app.delete('/custom-gpts/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await customGPTService.deleteCustomGPT(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        error: 'Custom GPT not found',
      });
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting custom GPT:', error);
    res.status(500).json({
      error: 'Failed to delete custom GPT',
      message: error.message,
    });
  }
});

// Duplicate a custom GPT
app.post('/custom-gpts/:id/duplicate', async (req: Request, res: Response) => {
  try {
    const duplicate = await customGPTService.duplicateCustomGPT(req.params.id);
    if (!duplicate) {
      return res.status(404).json({
        error: 'Custom GPT not found',
      });
    }
    res.json({ success: true, data: duplicate });
  } catch (error: any) {
    console.error('Error duplicating custom GPT:', error);
    res.status(500).json({
      error: 'Failed to duplicate custom GPT',
      message: error.message,
    });
  }
});

// Upload knowledge file to a custom GPT
app.post(
  '/custom-gpts/:id/knowledge',
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      const file = req.file as Express.Multer.File;
      if (!file) {
        return res.status(400).json({
          error: 'No file uploaded',
        });
      }

      // Validate file
      const validation = await validateFile(
        file.buffer,
        file.originalname,
        file.size
      );

      if (!validation.valid || validation.fileType !== 'document') {
        return res.status(400).json({
          error: validation.error || 'Only document files are allowed',
        });
      }

      const knowledgeFile = await customGPTService.addKnowledgeFile(
        req.params.id,
        file.buffer,
        file.originalname,
        validation.mimeType!
      );

      if (!knowledgeFile) {
        return res.status(404).json({
          error: 'Custom GPT not found',
        });
      }

      res.json({ success: true, data: knowledgeFile });
    } catch (error: any) {
      console.error('Error uploading knowledge file:', error);
      res.status(500).json({
        error: 'Failed to upload knowledge file',
        message: error.message,
      });
    }
  }
);

// Delete knowledge file from a custom GPT
app.delete(
  '/custom-gpts/:id/knowledge/:fileId',
  async (req: Request, res: Response) => {
    try {
      const deleted = await customGPTService.deleteKnowledgeFile(
        req.params.id,
        req.params.fileId
      );
      if (!deleted) {
        return res.status(404).json({
          error: 'Custom GPT or knowledge file not found',
        });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting knowledge file:', error);
      res.status(500).json({
        error: 'Failed to delete knowledge file',
        message: error.message,
      });
    }
  }
);

// Get relevant context from knowledge base
app.post('/custom-gpts/:id/context', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Query is required',
      });
    }

    const context = await customGPTService.getRelevantContext(
      req.params.id,
      query
    );
    res.json({ success: true, data: { context } });
  } catch (error: any) {
    console.error('Error getting context:', error);
    res.status(500).json({
      error: 'Failed to get context',
      message: error.message,
    });
  }
});

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Error handler - must be last
app.use(errorHandler);

// Start the server
app.listen(port, () => {
  console.log('\n🚀 Deep Research API Server');
  console.log(`   Port: ${port}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);

  const providerInfo = getProviderInfo();
  console.log('\n🤖 LLM Configuration:');
  console.log(`   Provider: ${providerInfo.provider}`);
  console.log(`   Model: ${providerInfo.model}`);
  if (providerInfo.baseURL) {
    console.log(`   Endpoint: ${providerInfo.baseURL}`);
  }
  console.log('');
});

export default app;
