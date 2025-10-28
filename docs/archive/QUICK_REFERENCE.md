# LLM Provider Quick Reference

## 🚀 Quick Setup

Choose your provider and copy the configuration to `.env.local`:

---

## OpenAI

### o3-mini (Default - Best for Reasoning)

```bash
LLM_PROVIDER="openai"
LLM_MODEL="o3-mini"
OPENAI_KEY="sk-proj-..."
```

### GPT-4o (Most Capable)

```bash
LLM_PROVIDER="openai"
LLM_MODEL="gpt-4o"
OPENAI_KEY="sk-proj-..."
```

### GPT-4o-mini (Fast & Affordable)

```bash
LLM_PROVIDER="openai"
LLM_MODEL="gpt-4o-mini"
OPENAI_KEY="sk-proj-..."
```

**Get API Key:** <https://platform.openai.com/api-keys>

---

## Fireworks AI

### DeepSeek R1 (Excellent Reasoning)

```bash
LLM_PROVIDER="fireworks"
LLM_MODEL="accounts/fireworks/models/deepseek-r1"
FIREWORKS_KEY="fw_..."
```

### Llama 3.3 70B (Fast & Capable)

```bash
LLM_PROVIDER="fireworks"
LLM_MODEL="accounts/fireworks/models/llama-v3p3-70b-instruct"
FIREWORKS_KEY="fw_..."
```

**Get API Key:** <https://fireworks.ai>

---

## OpenRouter

### GPT-4o (OpenAI's Best)

```bash
LLM_PROVIDER="openrouter"
LLM_MODEL="openai/gpt-4o"
OPENROUTER_KEY="sk-or-v1-..."
```

### Gemini 2.0 Flash (FREE!)

```bash
LLM_PROVIDER="openrouter"
LLM_MODEL="google/gemini-2.0-flash-exp:free"
OPENROUTER_KEY="sk-or-v1-..."
```

### Claude 3.5 Sonnet (Excellent Reasoning)

```bash
LLM_PROVIDER="openrouter"
LLM_MODEL="anthropic/claude-3.5-sonnet"
OPENROUTER_KEY="sk-or-v1-..."
```

### DeepSeek R1 (Advanced Reasoning)

```bash
LLM_PROVIDER="openrouter"
LLM_MODEL="deepseek/deepseek-r1"
OPENROUTER_KEY="sk-or-v1-..."
```

### Llama 3.3 70B (Open Source)

```bash
LLM_PROVIDER="openrouter"
LLM_MODEL="meta-llama/llama-3.3-70b-instruct"
OPENROUTER_KEY="sk-or-v1-..."
```

**Get API Key:** <https://openrouter.ai/keys>

---

## Local / Custom

### Ollama

```bash
# First: ollama pull llama3.1
LLM_PROVIDER="custom"
LLM_MODEL="llama3.1"
LLM_ENDPOINT="http://localhost:11434/v1"
OPENAI_KEY="not-needed"
```

### LM Studio

```bash
LLM_PROVIDER="custom"
LLM_MODEL="your-model-name"
LLM_ENDPOINT="http://localhost:1234/v1"
OPENAI_KEY="not-needed"
```

### vLLM

```bash
LLM_PROVIDER="custom"
LLM_MODEL="meta-llama/Llama-3.1-70B-Instruct"
LLM_ENDPOINT="http://localhost:8000/v1"
OPENAI_KEY="not-needed"
```

---

## 🆓 Free Options

### OpenRouter Free Models

```bash
LLM_PROVIDER="openrouter"
OPENROUTER_KEY="sk-or-v1-..."

# Choose one:
LLM_MODEL="google/gemini-2.0-flash-exp:free"
LLM_MODEL="meta-llama/llama-3.1-8b-instruct:free"
LLM_MODEL="mistralai/mistral-7b-instruct:free"
```

### Local Models (Completely Free)

```bash
# Ollama, LM Studio, vLLM - see above
```

---

## 🔧 Advanced Options

### Custom Endpoint Override

```bash
LLM_PROVIDER="openai"
LLM_MODEL="gpt-4o"
LLM_ENDPOINT="https://your-proxy.com/v1"
OPENAI_KEY="sk-..."
```

### Adjust Context Size

```bash
CONTEXT_SIZE="200000"
```

---

## 🐛 Troubleshooting

### Error: "No LLM provider configured"

→ Set `LLM_PROVIDER` and the matching API key

### Error: "Invalid LLM_PROVIDER"

→ Use: `openai`, `fireworks`, `openrouter`, or `custom`

### Error: "No API key found"

→ Set the API key for your provider:

- OpenAI: `OPENAI_KEY`
- Fireworks: `FIREWORKS_KEY`
- OpenRouter: `OPENROUTER_KEY`
- Custom: `OPENAI_KEY` or `CUSTOM_API_KEY`

### Connection refused (local models)

→ Make sure your local server is running

---

## 📊 Model Comparison

| Model             | Provider   | Cost | Speed     | Reasoning  |
| ----------------- | ---------- | ---- | --------- | ---------- |
| o3-mini           | OpenAI     | $$   | Medium    | ⭐⭐⭐⭐⭐ |
| gpt-4o            | OpenAI     | $$$  | Fast      | ⭐⭐⭐⭐⭐ |
| gpt-4o-mini       | OpenAI     | $    | Very Fast | ⭐⭐⭐⭐   |
| deepseek-r1       | Fireworks  | $    | Fast      | ⭐⭐⭐⭐⭐ |
| claude-3.5-sonnet | OpenRouter | $$$  | Fast      | ⭐⭐⭐⭐⭐ |
| gemini-2.0-flash  | OpenRouter | FREE | Very Fast | ⭐⭐⭐⭐   |
| llama-3.3-70b     | OpenRouter | $$   | Fast      | ⭐⭐⭐⭐   |
| Local Models      | Custom     | FREE | Varies    | Varies     |

---

## 🔗 More Help

- **Detailed Guide:** [docs/LLM_PROVIDER_GUIDE.md](LLM_PROVIDER_GUIDE.md)
- **Main README:** [README.md](../README.md#llm-provider-configuration)
- **Examples:** [.env.example](../.env.example)

---

## 💡 Pro Tips

1. **Start with free options** - Try OpenRouter's free Gemini model
2. **Test locally first** - Use Ollama for development
3. **Check the logs** - Server shows active configuration on startup
4. **Use o3-mini for reasoning** - Best for research tasks
5. **Try DeepSeek R1** - Excellent reasoning at low cost
6. **OpenRouter for flexibility** - Access 100+ models with one key

---

## 📝 Template

Copy this template to your `.env.local`:

```bash
# ===================================
# Firecrawl (Required)
# ===================================
FIRECRAWL_KEY="your_firecrawl_key"

# ===================================
# LLM Provider (Choose One)
# ===================================

# Option 1: OpenAI
LLM_PROVIDER="openai"
LLM_MODEL="o3-mini"
OPENAI_KEY="sk-proj-..."

# Option 2: Fireworks
# LLM_PROVIDER="fireworks"
# LLM_MODEL="accounts/fireworks/models/deepseek-r1"
# FIREWORKS_KEY="fw_..."

# Option 3: OpenRouter
# LLM_PROVIDER="openrouter"
# LLM_MODEL="google/gemini-2.0-flash-exp:free"
# OPENROUTER_KEY="sk-or-v1-..."

# Option 4: Local
# LLM_PROVIDER="custom"
# LLM_MODEL="llama3.1"
# LLM_ENDPOINT="http://localhost:11434/v1"
# OPENAI_KEY="not-needed"

# ===================================
# Optional Settings
# ===================================
CONTEXT_SIZE="128000"
CONCURRENCY_LIMIT=2
PORT=3051
FRONTEND_URL=http://localhost:3000

# ===================================
# Frontend
# ===================================
NEXT_PUBLIC_API_URL=http://localhost:3051
NEXT_PUBLIC_APP_NAME=Deep Research
```
