import { createFireworks } from '@ai-sdk/fireworks';
import { createOpenAI } from '@ai-sdk/openai';
import {
  extractReasoningMiddleware,
  LanguageModelV1,
  wrapLanguageModel,
} from 'ai';
import { getEncoding } from 'js-tiktoken';

import { RecursiveCharacterTextSplitter } from './text-splitter';

// ===================================
// Provider Configuration Types
// ===================================

type LLMProvider = 'openai' | 'fireworks' | 'openrouter' | 'custom';

interface ProviderConfig {
  provider: LLMProvider;
  model: string;
  apiKey: string;
  baseURL?: string;
  structuredOutputs?: boolean;
  reasoningEffort?: 'low' | 'medium' | 'high';
}

// ===================================
// Provider Presets
// ===================================

const PROVIDER_DEFAULTS: Record<
  LLMProvider,
  { baseURL: string; defaultModel: string }
> = {
  openai: {
    baseURL: 'https://api.openai.com/v1',
    defaultModel: 'o3-mini',
  },
  fireworks: {
    baseURL: 'https://api.fireworks.ai/inference/v1',
    defaultModel: 'accounts/fireworks/models/deepseek-r1',
  },
  openrouter: {
    baseURL: 'https://openrouter.ai/api/v1',
    defaultModel: 'openai/gpt-4o',
  },
  custom: {
    baseURL: 'http://localhost:11434/v1',
    defaultModel: 'llama3.1',
  },
};

// Recommended models for each provider
export const RECOMMENDED_MODELS = {
  openai: ['o3-mini', 'o1-mini', 'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
  fireworks: [
    'accounts/fireworks/models/deepseek-r1',
    'accounts/fireworks/models/llama-v3p3-70b-instruct',
    'accounts/fireworks/models/qwen2p5-72b-instruct',
  ],
  openrouter: [
    'openai/gpt-4o',
    'openai/gpt-4o-mini',
    'google/gemini-2.0-flash-exp:free',
    'anthropic/claude-3.5-sonnet',
    'meta-llama/llama-3.3-70b-instruct',
    'deepseek/deepseek-r1',
  ],
  custom: [],
} as const;

// ===================================
// Configuration Loading
// ===================================

function getProviderConfig(): ProviderConfig {
  // 1. Check for explicit LLM_PROVIDER configuration (new way)
  const explicitProvider = process.env.LLM_PROVIDER as LLMProvider | undefined;

  if (explicitProvider) {
    const provider = explicitProvider.toLowerCase() as LLMProvider;

    if (!['openai', 'fireworks', 'openrouter', 'custom'].includes(provider)) {
      throw new Error(
        `Invalid LLM_PROVIDER: "${explicitProvider}". Must be one of: openai, fireworks, openrouter, custom`,
      );
    }

    const apiKey = getApiKeyForProvider(provider);
    const model =
      process.env.LLM_MODEL || PROVIDER_DEFAULTS[provider].defaultModel;
    const baseURL =
      process.env.LLM_ENDPOINT || PROVIDER_DEFAULTS[provider].baseURL;

    console.log(`🤖 Using LLM Provider: ${provider}`);
    console.log(`📦 Model: ${model}`);
    console.log(`🔗 Endpoint: ${baseURL}`);

    return {
      provider,
      model,
      apiKey,
      baseURL,
      structuredOutputs: provider === 'openai' || provider === 'openrouter',
      reasoningEffort: provider === 'openai' ? 'medium' : undefined,
    };
  }

  // 2. Backward compatibility: Auto-detect from legacy env vars
  console.log(
    '⚠️  Using legacy provider detection. Consider setting LLM_PROVIDER explicitly.',
  );

  // Check for custom model first (legacy CUSTOM_MODEL)
  if (process.env.CUSTOM_MODEL && process.env.OPENAI_KEY) {
    console.log(`🤖 Detected custom model: ${process.env.CUSTOM_MODEL}`);
    return {
      provider: 'custom',
      model: process.env.CUSTOM_MODEL,
      apiKey: process.env.OPENAI_KEY,
      baseURL: process.env.OPENAI_ENDPOINT || 'http://localhost:11434/v1',
      structuredOutputs: true,
    };
  }

  // Check for Fireworks (DeepSeek R1)
  if (process.env.FIREWORKS_KEY) {
    console.log('🤖 Detected Fireworks API key, using DeepSeek R1');
    return {
      provider: 'fireworks',
      model: 'accounts/fireworks/models/deepseek-r1',
      apiKey: process.env.FIREWORKS_KEY,
      baseURL: PROVIDER_DEFAULTS.fireworks.baseURL,
    };
  }

  // Check for OpenRouter
  if (process.env.OPENROUTER_KEY) {
    console.log('🤖 Detected OpenRouter API key');
    return {
      provider: 'openrouter',
      model: process.env.LLM_MODEL || PROVIDER_DEFAULTS.openrouter.defaultModel,
      apiKey: process.env.OPENROUTER_KEY,
      baseURL: PROVIDER_DEFAULTS.openrouter.baseURL,
      structuredOutputs: true,
    };
  }

  // Default to OpenAI
  if (process.env.OPENAI_KEY) {
    console.log('🤖 Using OpenAI (default)');
    return {
      provider: 'openai',
      model: 'o3-mini',
      apiKey: process.env.OPENAI_KEY,
      baseURL: process.env.OPENAI_ENDPOINT || PROVIDER_DEFAULTS.openai.baseURL,
      structuredOutputs: true,
      reasoningEffort: 'medium',
    };
  }

  throw new Error(
    'No LLM provider configured. Please set one of:\n' +
      '  - LLM_PROVIDER + LLM_MODEL (recommended)\n' +
      '  - OPENAI_KEY (for OpenAI)\n' +
      '  - FIREWORKS_KEY (for DeepSeek R1)\n' +
      '  - OPENROUTER_KEY (for OpenRouter)\n' +
      'See README.md for configuration examples.',
  );
}

function getApiKeyForProvider(provider: LLMProvider): string {
  const keyMap: Record<LLMProvider, string | undefined> = {
    openai: process.env.OPENAI_KEY,
    fireworks: process.env.FIREWORKS_KEY,
    openrouter: process.env.OPENROUTER_KEY,
    custom: process.env.OPENAI_KEY || process.env.CUSTOM_API_KEY,
  };

  const apiKey = keyMap[provider];

  if (!apiKey) {
    const envVarMap: Record<LLMProvider, string> = {
      openai: 'OPENAI_KEY',
      fireworks: 'FIREWORKS_KEY',
      openrouter: 'OPENROUTER_KEY',
      custom: 'OPENAI_KEY or CUSTOM_API_KEY',
    };

    throw new Error(
      `No API key found for provider "${provider}". Please set ${envVarMap[provider]}`,
    );
  }

  return apiKey;
}

// ===================================
// Model Creation
// ===================================

function createModelFromConfig(config: ProviderConfig): LanguageModelV1 {
  switch (config.provider) {
    case 'openai': {
      const openai = createOpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
      });

      const modelOptions: any = {};

      if (config.structuredOutputs) {
        modelOptions.structuredOutputs = true;
      }

      if (config.reasoningEffort && config.model.startsWith('o')) {
        modelOptions.reasoningEffort = config.reasoningEffort;
      }

      return openai(config.model, modelOptions) as LanguageModelV1;
    }

    case 'fireworks': {
      const fireworks = createFireworks({
        apiKey: config.apiKey,
      });

      // DeepSeek R1 needs reasoning extraction
      if (config.model.includes('deepseek-r1')) {
        return wrapLanguageModel({
          model: fireworks(config.model) as LanguageModelV1,
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        });
      }

      return fireworks(config.model) as LanguageModelV1;
    }

    case 'openrouter': {
      const openrouter = createOpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
      });

      return openrouter(config.model, {
        structuredOutputs: config.structuredOutputs,
      }) as LanguageModelV1;
    }

    case 'custom': {
      const custom = createOpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
      });

      return custom(config.model, {
        structuredOutputs: config.structuredOutputs,
      }) as LanguageModelV1;
    }

    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

// ===================================
// Public API
// ===================================

let cachedModel: LanguageModelV1 | null = null;
let cachedConfig: ProviderConfig | null = null;

export function getModel(
  overrideProvider?: string,
  overrideModel?: string,
): LanguageModelV1 {
  // If override is provided, create a new model instance
  if (overrideProvider && overrideModel) {
    const provider = overrideProvider.toLowerCase() as LLMProvider;

    if (!['openai', 'fireworks', 'openrouter', 'custom'].includes(provider)) {
      console.warn(
        `Invalid provider override: "${overrideProvider}". Using default.`,
      );
      // Fall through to default
    } else {
      try {
        const apiKey = getApiKeyForProvider(provider);
        const baseURL =
          process.env.LLM_ENDPOINT || PROVIDER_DEFAULTS[provider].baseURL;

        const overrideConfig: ProviderConfig = {
          provider,
          model: overrideModel,
          apiKey,
          baseURL,
          structuredOutputs: provider === 'openai' || provider === 'openrouter',
          reasoningEffort: provider === 'openai' ? 'medium' : undefined,
        };

        console.log(`🔄 Using override: ${provider} - ${overrideModel}`);
        return createModelFromConfig(overrideConfig);
      } catch (error) {
        console.error(`Failed to create model with override:`, error);
        console.log(`Falling back to default configuration`);
        // Fall through to default
      }
    }
  }

  // Use cached model if available
  if (cachedModel) {
    return cachedModel;
  }

  const config = getProviderConfig();
  cachedConfig = config;
  cachedModel = createModelFromConfig(config);

  return cachedModel;
}

export function getProviderInfo(): {
  provider: string;
  model: string;
  baseURL?: string;
} {
  if (!cachedConfig) {
    getModel(); // Initialize if not already done
  }

  return {
    provider: cachedConfig!.provider,
    model: cachedConfig!.model,
    baseURL: cachedConfig!.baseURL,
  };
}

const MinChunkSize = 140;
const encoder = getEncoding('o200k_base');

// trim prompt to maximum context size
export function trimPrompt(
  prompt: string,
  contextSize = Number(process.env.CONTEXT_SIZE) || 128_000,
) {
  if (!prompt) {
    return '';
  }

  const length = encoder.encode(prompt).length;
  if (length <= contextSize) {
    return prompt;
  }

  const overflowTokens = length - contextSize;
  // on average it's 3 characters per token, so multiply by 3 to get a rough estimate of the number of characters
  const chunkSize = prompt.length - overflowTokens * 3;
  if (chunkSize < MinChunkSize) {
    return prompt.slice(0, MinChunkSize);
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap: 0,
  });
  const trimmedPrompt = splitter.splitText(prompt)[0] ?? '';

  // last catch, there's a chance that the trimmed prompt is same length as the original prompt, due to how tokens are split & innerworkings of the splitter, handle this case by just doing a hard cut
  if (trimmedPrompt.length === prompt.length) {
    return trimPrompt(prompt.slice(0, chunkSize), contextSize);
  }

  // recursively trim until the prompt is within the context size
  return trimPrompt(trimmedPrompt, contextSize);
}
