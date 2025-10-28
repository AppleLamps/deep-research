# LLM Provider Configuration Guide

This guide explains how to configure different LLM providers for Deep Research.

## Table of Contents

- [Quick Start](#quick-start)
- [Provider Setup](#provider-setup)
  - [OpenAI](#openai)
  - [Fireworks AI](#fireworks-ai)
  - [OpenRouter](#openrouter)
  - [Custom / Local LLM](#custom--local-llm)
- [Configuration Reference](#configuration-reference)
- [Troubleshooting](#troubleshooting)
- [Migration from Legacy Config](#migration-from-legacy-config)

---

## Quick Start

The easiest way to configure an LLM provider is to set these three environment variables:

```bash
LLM_PROVIDER="openai"           # Provider: openai | fireworks | openrouter | custom
LLM_MODEL="o3-mini"             # Model name (provider-specific)
OPENAI_KEY="sk-..."             # API key for the chosen provider
```

That's it! The system will automatically configure the correct endpoint and settings.

---

## Provider Setup

### OpenAI

**Best for:** Production use, reasoning tasks, structured outputs

#### Configuration

```bash
LLM_PROVIDER="openai"
LLM_MODEL="o3-mini"
OPENAI_KEY="sk-proj-..."
```

#### Recommended Models

| Model         | Best For                    | Cost   | Speed     |
| ------------- | --------------------------- | ------ | --------- |
| `o3-mini`     | Reasoning tasks (default)   | Medium | Medium    |
| `gpt-4o`      | Most capable, complex tasks | High   | Fast      |
| `gpt-4o-mini` | Cost-effective, fast        | Low    | Very Fast |
| `o1-mini`     | Advanced reasoning          | Medium | Slow      |
| `gpt-4-turbo` | Legacy, still capable       | High   | Fast      |

#### Get an API Key

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add credits to your account

---

### Fireworks AI

**Best for:** DeepSeek R1, fast inference, cost-effective

#### Configuration

```bash
LLM_PROVIDER="fireworks"
LLM_MODEL="accounts/fireworks/models/deepseek-r1"
FIREWORKS_KEY="fw_..."
```

#### Recommended Models

| Model                                               | Best For            | Cost | Speed     |
| --------------------------------------------------- | ------------------- | ---- | --------- |
| `accounts/fireworks/models/deepseek-r1`             | Reasoning (default) | Low  | Fast      |
| `accounts/fireworks/models/llama-v3p3-70b-instruct` | General tasks       | Low  | Very Fast |
| `accounts/fireworks/models/qwen2p5-72b-instruct`    | Strong performance  | Low  | Fast      |

#### Get an API Key

1. Go to [https://fireworks.ai](https://fireworks.ai)
2. Sign up and navigate to API Keys
3. Create a new API key

---

### OpenRouter

**Best for:** Access to 100+ models, flexibility, free tier available

#### Configuration

```bash
LLM_PROVIDER="openrouter"
LLM_MODEL="openai/gpt-4o"
OPENROUTER_KEY="sk-or-v1-..."
```

#### Recommended Models

| Model                               | Provider  | Cost | Notes                |
| ----------------------------------- | --------- | ---- | -------------------- |
| `openai/gpt-4o`                     | OpenAI    | $$$  | Most capable         |
| `openai/gpt-4o-mini`                | OpenAI    | $    | Fast & affordable    |
| `google/gemini-2.0-flash-exp:free`  | Google    | FREE | Very fast, free tier |
| `anthropic/claude-3.5-sonnet`       | Anthropic | $$$  | Excellent reasoning  |
| `meta-llama/llama-3.3-70b-instruct` | Meta      | $$   | Open source          |
| `deepseek/deepseek-r1`              | DeepSeek  | $    | Advanced reasoning   |
| `qwen/qwen-2.5-72b-instruct`        | Alibaba   | $    | Strong performance   |

#### Get an API Key

1. Go to [https://openrouter.ai/keys](https://openrouter.ai/keys)
2. Sign in with Google/GitHub
3. Create a new API key
4. Add credits (or use free models)

#### Free Models

OpenRouter offers several free models:

- `google/gemini-2.0-flash-exp:free`
- `meta-llama/llama-3.1-8b-instruct:free`
- `mistralai/mistral-7b-instruct:free`

---

### Custom / Local LLM

**Best for:** Privacy, offline use, cost savings, experimentation

#### Configuration

```bash
LLM_PROVIDER="custom"
LLM_MODEL="llama3.1"
LLM_ENDPOINT="http://localhost:11434/v1"
OPENAI_KEY="not-needed"          # Can be any string
```

#### Compatible Platforms

##### 1. Ollama

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama3.1

# Configuration
LLM_PROVIDER="custom"
LLM_MODEL="llama3.1"
LLM_ENDPOINT="http://localhost:11434/v1"
OPENAI_KEY="not-needed"
```

**Recommended Models:**

- `llama3.1` - General purpose
- `qwen2.5:72b` - Strong reasoning
- `deepseek-r1:70b` - Advanced reasoning

##### 2. LM Studio

```bash
# Download from https://lmstudio.ai
# Load a model in the UI
# Start the local server

# Configuration
LLM_PROVIDER="custom"
LLM_MODEL="your-model-name"
LLM_ENDPOINT="http://localhost:1234/v1"
OPENAI_KEY="not-needed"
```

##### 3. vLLM

```bash
# Install vLLM
pip install vllm

# Start server
python -m vllm.entrypoints.openai.api_server \
  --model meta-llama/Llama-3.1-70B-Instruct \
  --port 8000

# Configuration
LLM_PROVIDER="custom"
LLM_MODEL="meta-llama/Llama-3.1-70B-Instruct"
LLM_ENDPOINT="http://localhost:8000/v1"
OPENAI_KEY="not-needed"
```

---

## Configuration Reference

### Environment Variables

| Variable         | Required    | Description        | Example                                       |
| ---------------- | ----------- | ------------------ | --------------------------------------------- |
| `LLM_PROVIDER`   | Yes\*       | Provider name      | `openai`, `fireworks`, `openrouter`, `custom` |
| `LLM_MODEL`      | Yes\*       | Model name         | `o3-mini`, `gpt-4o`, etc.                     |
| `LLM_ENDPOINT`   | No          | Custom endpoint    | `https://api.openai.com/v1`                   |
| `OPENAI_KEY`     | Conditional | OpenAI API key     | `sk-proj-...`                                 |
| `FIREWORKS_KEY`  | Conditional | Fireworks API key  | `fw_...`                                      |
| `OPENROUTER_KEY` | Conditional | OpenRouter API key | `sk-or-v1-...`                                |
| `CONTEXT_SIZE`   | No          | Max context tokens | `128000` (default)                            |

\* Required for new configuration. Legacy env vars still work for backward compatibility.

### Provider Defaults

Each provider has sensible defaults:

| Provider     | Default Endpoint                        | Default Model                           |
| ------------ | --------------------------------------- | --------------------------------------- |
| `openai`     | `https://api.openai.com/v1`             | `o3-mini`                               |
| `fireworks`  | `https://api.fireworks.ai/inference/v1` | `accounts/fireworks/models/deepseek-r1` |
| `openrouter` | `https://openrouter.ai/api/v1`          | `openai/gpt-4o`                         |
| `custom`     | `http://localhost:11434/v1`             | `llama3.1`                              |

---

## Troubleshooting

### Error: "No LLM provider configured"

**Cause:** No API key or provider configuration found.

**Solution:**

1. Set `LLM_PROVIDER` environment variable
2. Set the corresponding API key (`OPENAI_KEY`, `FIREWORKS_KEY`, or `OPENROUTER_KEY`)
3. Restart the server

### Error: "Invalid LLM_PROVIDER"

**Cause:** Invalid provider name.

**Solution:** Use one of: `openai`, `fireworks`, `openrouter`, `custom`

### Error: "No API key found for provider"

**Cause:** Provider is set but API key is missing.

**Solution:**

- For `openai`: Set `OPENAI_KEY`
- For `fireworks`: Set `FIREWORKS_KEY`
- For `openrouter`: Set `OPENROUTER_KEY`
- For `custom`: Set `OPENAI_KEY` or `CUSTOM_API_KEY`

### Model not working as expected

**Possible causes:**

1. Model name is incorrect for the provider
2. API key doesn't have access to the model
3. Model requires special configuration

**Solution:**

1. Check provider's documentation for correct model names
2. Verify your API key has access to the model
3. Check the console logs for detailed error messages

### Connection refused (local models)

**Cause:** Local server is not running.

**Solution:**

1. Start your local LLM server (Ollama, LM Studio, etc.)
2. Verify the endpoint URL is correct
3. Test with: `curl http://localhost:11434/v1/models`

---

## Migration from Legacy Config

### Old Configuration (Deprecated)

```bash
OPENAI_KEY="sk-..."
CUSTOM_MODEL="gpt-4o"
OPENAI_ENDPOINT="https://api.openai.com/v1"
```

### New Configuration (Recommended)

```bash
LLM_PROVIDER="openai"
LLM_MODEL="gpt-4o"
OPENAI_KEY="sk-..."
```

### Migration Steps

1. **Identify your current setup:**

   - Using OpenAI? → `LLM_PROVIDER="openai"`
   - Using Fireworks? → `LLM_PROVIDER="fireworks"`
   - Using custom endpoint? → `LLM_PROVIDER="openrouter"` or `"custom"`

2. **Set the new variables:**

   ```bash
   LLM_PROVIDER="your_provider"
   LLM_MODEL="your_model"
   ```

3. **Keep your API key:**

   - Your existing `OPENAI_KEY`, `FIREWORKS_KEY` still work

4. **Remove deprecated variables (optional):**
   - `CUSTOM_MODEL` → Use `LLM_MODEL` instead
   - `OPENAI_ENDPOINT` → Use `LLM_ENDPOINT` instead

### Backward Compatibility

The old configuration still works! The system will:

1. Check for `LLM_PROVIDER` first (new way)
2. Fall back to auto-detection from legacy env vars
3. Show a warning suggesting migration

---

## Examples

### Example 1: OpenAI with o3-mini

```bash
LLM_PROVIDER="openai"
LLM_MODEL="o3-mini"
OPENAI_KEY="sk-proj-abc123..."
```

### Example 2: OpenRouter with free Gemini

```bash
LLM_PROVIDER="openrouter"
LLM_MODEL="google/gemini-2.0-flash-exp:free"
OPENROUTER_KEY="sk-or-v1-xyz789..."
```

### Example 3: Local Ollama

```bash
LLM_PROVIDER="custom"
LLM_MODEL="llama3.1"
LLM_ENDPOINT="http://localhost:11434/v1"
OPENAI_KEY="not-needed"
```

### Example 4: Fireworks DeepSeek R1

```bash
LLM_PROVIDER="fireworks"
LLM_MODEL="accounts/fireworks/models/deepseek-r1"
FIREWORKS_KEY="fw_abc123..."
```

---

## Support

For more help:

- Check the main [README.md](../README.md)
- Open an issue on GitHub
- Review the [.env.example](../.env.example) file
