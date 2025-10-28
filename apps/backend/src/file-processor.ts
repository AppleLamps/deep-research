import fs from 'fs/promises';
import path from 'path';
import { generateText } from 'ai';
import { fileTypeFromBuffer } from 'file-type';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

import { getModel } from './ai/providers';

// ===================================
// File Type Validation
// ===================================

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  fileType?: 'image' | 'document';
  mimeType?: string;
}

/**
 * Validate file type and size
 */
export async function validateFile(
  buffer: Buffer,
  originalName: string,
  size: number,
): Promise<FileValidationResult> {
  // Check file size
  if (size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Detect actual file type from buffer (prevents spoofing)
  const fileTypeResult = await fileTypeFromBuffer(buffer);

  // For text files, fileTypeFromBuffer returns undefined
  const isTextFile = originalName.match(/\.(txt|md)$/i);

  if (!fileTypeResult && !isTextFile) {
    return {
      valid: false,
      error: 'Unable to determine file type',
    };
  }

  const mimeType = fileTypeResult?.mime || (isTextFile ? 'text/plain' : '');

  // Check if it's an allowed image
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    return {
      valid: true,
      fileType: 'image',
      mimeType,
    };
  }

  // Check if it's an allowed document
  if (ALLOWED_DOCUMENT_TYPES.includes(mimeType) || isTextFile) {
    return {
      valid: true,
      fileType: 'document',
      mimeType: mimeType || 'text/plain',
    };
  }

  return {
    valid: false,
    error: `File type ${mimeType} is not supported. Allowed types: images (jpg, png, gif, webp) and documents (pdf, txt, md, doc, docx)`,
  };
}

// ===================================
// Document Text Extraction
// ===================================

/**
 * Extract text from PDF
 */
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Extract text from DOCX
 */
async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw new Error('Failed to extract text from DOCX');
  }
}

/**
 * Extract text from plain text file
 */
async function extractTextFromPlainText(buffer: Buffer): Promise<string> {
  return buffer.toString('utf-8');
}

/**
 * Extract text from document based on mime type
 */
export async function extractTextFromDocument(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  switch (mimeType) {
    case 'application/pdf':
      return extractTextFromPDF(buffer);

    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/msword':
      return extractTextFromDOCX(buffer);

    case 'text/plain':
    case 'text/markdown':
      return extractTextFromPlainText(buffer);

    default:
      throw new Error(`Unsupported document type: ${mimeType}`);
  }
}

// ===================================
// Image Analysis with Vision Models
// ===================================

/**
 * Analyze image using vision-capable LLM
 */
export async function analyzeImage(
  imageBuffer: Buffer,
  mimeType: string,
  userPrompt?: string,
  modelOverride?: { provider?: string; model?: string },
): Promise<string> {
  try {
    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    // Get vision-capable model
    // For vision, we need to use specific models
    const visionModel = getModel(
      modelOverride?.provider || 'openai',
      modelOverride?.model || 'gpt-4o',
    );

    const prompt = userPrompt || 'Describe this image in detail.';

    // Use generateText with image
    const result = await generateText({
      model: visionModel,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image', image: dataUrl },
          ],
        },
      ],
    });

    return result.text;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw new Error('Failed to analyze image with vision model');
  }
}

// ===================================
// File Storage
// ===================================

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

/**
 * Ensure upload directory exists
 */
export async function ensureUploadDir(): Promise<void> {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Save file to disk
 */
export async function saveFile(
  buffer: Buffer,
  filename: string,
): Promise<string> {
  await ensureUploadDir();
  const filepath = path.join(UPLOAD_DIR, filename);
  await fs.writeFile(filepath, buffer);
  return filepath;
}

/**
 * Delete file from disk
 */
export async function deleteFile(filepath: string): Promise<void> {
  try {
    await fs.unlink(filepath);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

/**
 * Generate unique filename
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, ext);
  const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '_');
  return `${timestamp}-${random}-${sanitized}${ext}`;
}

/**
 * Clean up old files (older than 24 hours)
 */
export async function cleanupOldFiles(): Promise<void> {
  try {
    await ensureUploadDir();
    const files = await fs.readdir(UPLOAD_DIR);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const file of files) {
      const filepath = path.join(UPLOAD_DIR, file);
      const stats = await fs.stat(filepath);
      const age = now - stats.mtimeMs;

      if (age > maxAge) {
        await deleteFile(filepath);
        console.log(`Cleaned up old file: ${file}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up old files:', error);
  }
}

// Run cleanup on startup and every hour
cleanupOldFiles();
setInterval(cleanupOldFiles, 60 * 60 * 1000);
