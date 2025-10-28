import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type {
  CustomGPT,
  CreateCustomGPTRequest,
  UpdateCustomGPTRequest,
  KnowledgeFile,
  TextChunk,
} from '@deep-research/types';
import { extractTextFromDocument } from './file-processor';
import { RecursiveCharacterTextSplitter } from './ai/text-splitter';

// ===================================
// Storage Configuration
// ===================================

const CUSTOM_GPTS_DIR = path.join(process.cwd(), 'data', 'custom-gpts');
const KNOWLEDGE_BASE_DIR = path.join(process.cwd(), 'data', 'knowledge-base');
const CONFIG_FILE = path.join(CUSTOM_GPTS_DIR, 'custom-gpts.json');

// ===================================
// Custom GPT Service
// ===================================

class CustomGPTService {
  private customGPTs: Map<string, CustomGPT> = new Map();
  private initialized = false;

  /**
   * Initialize the service and load existing custom GPTs
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Ensure directories exist
      await fs.mkdir(CUSTOM_GPTS_DIR, { recursive: true });
      await fs.mkdir(KNOWLEDGE_BASE_DIR, { recursive: true });

      // Load existing custom GPTs from file
      try {
        const data = await fs.readFile(CONFIG_FILE, 'utf-8');
        const customGPTs: CustomGPT[] = JSON.parse(data);
        customGPTs.forEach((gpt) => this.customGPTs.set(gpt.id, gpt));
        console.log(`Loaded ${customGPTs.length} custom GPTs`);
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          console.error('Error loading custom GPTs:', error);
        }
        // File doesn't exist yet, that's okay
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Custom GPT service:', error);
      throw error;
    }
  }

  /**
   * Save custom GPTs to disk
   */
  private async save(): Promise<void> {
    const customGPTs = Array.from(this.customGPTs.values());
    await fs.writeFile(CONFIG_FILE, JSON.stringify(customGPTs, null, 2));
  }

  /**
   * Create a new custom GPT
   */
  async createCustomGPT(request: CreateCustomGPTRequest): Promise<CustomGPT> {
    await this.init();

    const now = new Date().toISOString();
    const customGPT: CustomGPT = {
      id: uuidv4(),
      name: request.name,
      description: request.description,
      instructions: request.instructions,
      conversationStarters: request.conversationStarters || [],
      knowledgeFiles: [],
      settings: {
        temperature: 1,
        ...request.settings,
      },
      capabilities: {
        webSearch: true,
        fileAnalysis: true,
        imageGeneration: false,
        codeInterpreter: false,
        ...request.capabilities,
      },
      createdAt: now,
      updatedAt: now,
      avatar: request.avatar,
    };

    this.customGPTs.set(customGPT.id, customGPT);
    await this.save();

    console.log(`Created custom GPT: ${customGPT.name} (${customGPT.id})`);
    return customGPT;
  }

  /**
   * Get all custom GPTs
   */
  async getAllCustomGPTs(): Promise<CustomGPT[]> {
    await this.init();
    return Array.from(this.customGPTs.values());
  }

  /**
   * Get a custom GPT by ID
   */
  async getCustomGPT(id: string): Promise<CustomGPT | null> {
    await this.init();
    return this.customGPTs.get(id) || null;
  }

  /**
   * Update a custom GPT
   */
  async updateCustomGPT(
    id: string,
    updates: Partial<UpdateCustomGPTRequest>,
  ): Promise<CustomGPT | null> {
    await this.init();

    const customGPT = this.customGPTs.get(id);
    if (!customGPT) return null;

    const updatedGPT: CustomGPT = {
      ...customGPT,
      ...updates,
      id, // Ensure ID doesn't change
      knowledgeFiles: customGPT.knowledgeFiles, // Don't update via this method
      updatedAt: new Date().toISOString(),
    };

    this.customGPTs.set(id, updatedGPT);
    await this.save();

    console.log(`Updated custom GPT: ${updatedGPT.name} (${id})`);
    return updatedGPT;
  }

  /**
   * Delete a custom GPT
   */
  async deleteCustomGPT(id: string): Promise<boolean> {
    await this.init();

    const customGPT = this.customGPTs.get(id);
    if (!customGPT) return false;

    // Delete all knowledge files
    for (const file of customGPT.knowledgeFiles) {
      try {
        await fs.unlink(file.storagePath);
      } catch (error) {
        console.error(`Error deleting knowledge file: ${file.storagePath}`, error);
      }
    }

    this.customGPTs.delete(id);
    await this.save();

    console.log(`Deleted custom GPT: ${customGPT.name} (${id})`);
    return true;
  }

  /**
   * Duplicate a custom GPT
   */
  async duplicateCustomGPT(id: string): Promise<CustomGPT | null> {
    await this.init();

    const original = this.customGPTs.get(id);
    if (!original) return null;

    const now = new Date().toISOString();
    const duplicate: CustomGPT = {
      ...original,
      id: uuidv4(),
      name: `${original.name} (Copy)`,
      knowledgeFiles: [], // Don't copy knowledge files (would need to copy actual files)
      createdAt: now,
      updatedAt: now,
    };

    this.customGPTs.set(duplicate.id, duplicate);
    await this.save();

    console.log(`Duplicated custom GPT: ${duplicate.name} (${duplicate.id})`);
    return duplicate;
  }

  /**
   * Add a knowledge file to a custom GPT
   */
  async addKnowledgeFile(
    customGptId: string,
    buffer: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<KnowledgeFile | null> {
    await this.init();

    const customGPT = this.customGPTs.get(customGptId);
    if (!customGPT) return null;

    // Generate unique filename
    const fileId = uuidv4();
    const ext = path.extname(filename);
    const storagePath = path.join(KNOWLEDGE_BASE_DIR, `${fileId}${ext}`);

    // Save file to disk
    await fs.writeFile(storagePath, buffer);

    const knowledgeFile: KnowledgeFile = {
      id: fileId,
      name: filename,
      size: buffer.length,
      mimeType,
      uploadedAt: new Date().toISOString(),
      storagePath,
      processingStatus: 'pending',
    };

    customGPT.knowledgeFiles.push(knowledgeFile);
    customGPT.updatedAt = new Date().toISOString();
    await this.save();

    // Process file asynchronously
    this.processKnowledgeFile(customGptId, fileId).catch((error) => {
      console.error(`Error processing knowledge file ${fileId}:`, error);
    });

    console.log(`Added knowledge file: ${filename} to ${customGPT.name}`);
    return knowledgeFile;
  }

  /**
   * Process a knowledge file (extract text and chunk)
   */
  private async processKnowledgeFile(
    customGptId: string,
    fileId: string,
  ): Promise<void> {
    const customGPT = this.customGPTs.get(customGptId);
    if (!customGPT) return;

    const file = customGPT.knowledgeFiles.find((f) => f.id === fileId);
    if (!file) return;

    try {
      file.processingStatus = 'processing';
      await this.save();

      // Read file from disk
      const buffer = await fs.readFile(file.storagePath);

      // Extract text
      const extractedText = await extractTextFromDocument(buffer, file.mimeType);
      file.extractedText = extractedText;

      // Chunk text
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      const textChunks = splitter.splitText(extractedText);
      file.chunks = textChunks.map((text, index) => ({
        id: uuidv4(),
        text,
        startIndex: index * 800, // Approximate
        endIndex: index * 800 + text.length,
      }));

      file.processingStatus = 'completed';
      customGPT.updatedAt = new Date().toISOString();
      await this.save();

      console.log(
        `Processed knowledge file: ${file.name} (${file.chunks.length} chunks)`,
      );
    } catch (error: any) {
      file.processingStatus = 'error';
      file.error = error.message;
      await this.save();
      console.error(`Error processing knowledge file ${fileId}:`, error);
    }
  }

  /**
   * Delete a knowledge file from a custom GPT
   */
  async deleteKnowledgeFile(
    customGptId: string,
    fileId: string,
  ): Promise<boolean> {
    await this.init();

    const customGPT = this.customGPTs.get(customGptId);
    if (!customGPT) return false;

    const fileIndex = customGPT.knowledgeFiles.findIndex((f) => f.id === fileId);
    if (fileIndex === -1) return false;

    const file = customGPT.knowledgeFiles[fileIndex];

    // Delete file from disk
    try {
      await fs.unlink(file.storagePath);
    } catch (error) {
      console.error(`Error deleting file: ${file.storagePath}`, error);
    }

    customGPT.knowledgeFiles.splice(fileIndex, 1);
    customGPT.updatedAt = new Date().toISOString();
    await this.save();

    console.log(`Deleted knowledge file: ${file.name} from ${customGPT.name}`);
    return true;
  }

  /**
   * Get relevant context from knowledge base for a query
   */
  async getRelevantContext(customGptId: string, query: string): Promise<string> {
    await this.init();

    const customGPT = this.customGPTs.get(customGptId);
    if (!customGPT) return '';

    // Simple approach: concatenate all extracted text
    // Future: Use embeddings for semantic search
    const allText = customGPT.knowledgeFiles
      .filter((f) => f.processingStatus === 'completed' && f.extractedText)
      .map((f) => f.extractedText)
      .join('\n\n---\n\n');

    // Limit to reasonable size (e.g., 20k characters)
    return allText.slice(0, 20000);
  }
}

// Export singleton instance
export const customGPTService = new CustomGPTService();

