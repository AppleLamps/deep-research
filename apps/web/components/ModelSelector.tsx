"use client";

import { useState, useEffect } from "react";
import { Bot, Check, Sparkles, Copy } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "./ui/select";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { toast } from "sonner";

// Model configurations
type ModelConfig = {
  id: string;
  name: string;
  description: string;
  badge?: string;
};

const PROVIDERS: Record<string, { name: string; models: ModelConfig[] }> = {
  openai: {
    name: "OpenAI",
    models: [
      {
        id: "o3-mini",
        name: "o3-mini",
        description: "Best for reasoning",
        badge: "Recommended",
      },
      { id: "gpt-4o", name: "GPT-4o", description: "Most capable" },
      {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        description: "Fast & affordable",
      },
      { id: "o1-mini", name: "o1-mini", description: "Advanced reasoning" },
      { id: "gpt-4-turbo", name: "GPT-4 Turbo", description: "Legacy" },
      {
        id: "gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
        description: "Fastest, cheapest",
      },
    ],
  },
  fireworks: {
    name: "Fireworks AI",
    models: [
      {
        id: "accounts/fireworks/models/deepseek-r1",
        name: "DeepSeek R1",
        description: "Excellent reasoning",
        badge: "Recommended",
      },
      {
        id: "accounts/fireworks/models/llama-v3p3-70b-instruct",
        name: "Llama 3.3 70B",
        description: "Fast & capable",
      },
      {
        id: "accounts/fireworks/models/qwen2p5-72b-instruct",
        name: "Qwen 2.5 72B",
        description: "Strong performance",
      },
    ],
  },
  openrouter: {
    name: "OpenRouter",
    models: [
      { id: "openai/gpt-4o", name: "GPT-4o", description: "OpenAI's best" },
      {
        id: "openai/gpt-4o-mini",
        name: "GPT-4o Mini",
        description: "Fast & affordable",
      },
      {
        id: "google/gemini-2.0-flash-exp:free",
        name: "Gemini 2.0 Flash",
        description: "Free, very fast",
        badge: "Free",
      },
      {
        id: "anthropic/claude-3.5-sonnet",
        name: "Claude 3.5 Sonnet",
        description: "Excellent reasoning",
      },
      {
        id: "meta-llama/llama-3.3-70b-instruct",
        name: "Llama 3.3 70B",
        description: "Open source",
      },
      {
        id: "deepseek/deepseek-r1",
        name: "DeepSeek R1",
        description: "Advanced reasoning",
      },
      {
        id: "qwen/qwen-2.5-72b-instruct",
        name: "Qwen 2.5 72B",
        description: "Strong performance",
      },
    ],
  },
  custom: {
    name: "Custom / Local",
    models: [
      { id: "llama3.1", name: "Llama 3.1", description: "Local model" },
      { id: "qwen2.5:72b", name: "Qwen 2.5 72B", description: "Local model" },
      {
        id: "deepseek-r1:70b",
        name: "DeepSeek R1 70B",
        description: "Local model",
      },
    ],
  },
};

interface ModelSelectorProps {
  onModelChange?: (provider: string, model: string) => void;
}

export function ModelSelector({ onModelChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState<keyof typeof PROVIDERS>("openai");
  const [model, setModel] = useState("o3-mini");
  const [currentProvider, setCurrentProvider] = useState<string>("openai");
  const [currentModel, setCurrentModel] = useState<string>("o3-mini");

  // Load current settings from localStorage on mount
  useEffect(() => {
    const savedProvider = localStorage.getItem("llm_provider") || "openai";
    const savedModel = localStorage.getItem("llm_model") || "o3-mini";
    setProvider(savedProvider as keyof typeof PROVIDERS);
    setModel(savedModel);
    setCurrentProvider(savedProvider);
    setCurrentModel(savedModel);
  }, []);

  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider as keyof typeof PROVIDERS);
    // Set default model for the provider
    const defaultModel =
      PROVIDERS[newProvider as keyof typeof PROVIDERS].models[0].id;
    setModel(defaultModel);
  };

  const getEnvConfig = () => {
    if (provider === "openai") {
      return `OPENAI_KEY="sk-..."`;
    } else if (provider === "fireworks") {
      return `FIREWORKS_KEY="fw_..."`;
    } else if (provider === "openrouter") {
      return `OPENROUTER_KEY="sk-or-..."`;
    } else if (provider === "custom") {
      return `# No API key needed for local models\nLLM_ENDPOINT="http://localhost:11434/v1"`;
    }
    return "";
  };

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(getEnvConfig());
    toast.success("Configuration copied to clipboard");
  };

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem("llm_provider", provider);
    localStorage.setItem("llm_model", model);

    setCurrentProvider(provider);
    setCurrentModel(model);

    // Notify parent component
    onModelChange?.(provider, model);

    toast.success("Model configuration saved", {
      description: `Next research will use ${PROVIDERS[provider].name} - ${PROVIDERS[provider].models.find((m) => m.id === model)?.name}`,
    });

    setOpen(false);
  };

  const getCurrentModelName = () => {
    const providerConfig = PROVIDERS[currentProvider as keyof typeof PROVIDERS];
    if (!providerConfig) return "Unknown Model";
    const modelConfig = providerConfig.models.find(
      (m) => m.id === currentModel,
    );
    return modelConfig
      ? `${providerConfig.name} - ${modelConfig.name}`
      : "Unknown Model";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 h-9 rounded-lg">
          <Bot className="h-4 w-4" />
          <span className="hidden sm:inline">{getCurrentModelName()}</span>
          <span className="sm:hidden">Model</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Select LLM Model
          </DialogTitle>
          <DialogDescription>
            Choose your preferred AI provider and model. Changes apply
            immediately to new research sessions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Select value={provider} onValueChange={handleProviderChange}>
              <SelectTrigger id="provider">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">
                  <div className="flex items-center gap-2">
                    <span>OpenAI</span>
                  </div>
                </SelectItem>
                <SelectItem value="fireworks">
                  <div className="flex items-center gap-2">
                    <span>Fireworks AI</span>
                  </div>
                </SelectItem>
                <SelectItem value="openrouter">
                  <div className="flex items-center gap-2">
                    <span>OpenRouter</span>
                    <Badge variant="secondary" className="text-xs">
                      100+ models
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem value="custom">
                  <div className="flex items-center gap-2">
                    <span>Custom / Local</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger id="model">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{PROVIDERS[provider].name} Models</SelectLabel>
                  {PROVIDERS[provider].models.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex items-center justify-between w-full gap-2">
                        <div className="flex flex-col">
                          <span className="font-medium">{m.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {m.description}
                          </span>
                        </div>
                        {m.badge && (
                          <Badge
                            variant={
                              m.badge === "Free" ? "secondary" : "default"
                            }
                            className="text-xs ml-2"
                          >
                            {m.badge}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Info Box */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="flex items-start gap-2">
              <Bot className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="space-y-1 text-sm">
                <p className="font-medium">Important:</p>
                <p className="text-muted-foreground">
                  Make sure you have the API key for{" "}
                  <strong>{PROVIDERS[provider].name}</strong> configured in your
                  backend's{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    .env.local
                  </code>{" "}
                  file:
                </p>
                <div className="relative bg-background rounded p-2 mt-2 font-mono text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    onClick={handleCopyConfig}
                    title="Copy to clipboard"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <div>{provider === "openai" && 'OPENAI_KEY="sk-..."'}</div>
                  <div>
                    {provider === "fireworks" && 'FIREWORKS_KEY="fw_..."'}
                  </div>
                  <div>
                    {provider === "openrouter" && 'OPENROUTER_KEY="sk-or-..."'}
                  </div>
                  <div>
                    {provider === "custom" &&
                      "# No API key needed for local models"}
                  </div>
                  <div>
                    {provider === "custom" &&
                      'LLM_ENDPOINT="http://localhost:11434/v1"'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Current Selection Preview */}
          <div className="rounded-lg border p-4 space-y-2">
            <p className="text-sm font-medium">Selected Configuration:</p>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Provider:</span>
                <span className="font-medium text-foreground">
                  {PROVIDERS[provider].name}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Model:</span>
                <span className="font-medium text-foreground">
                  {PROVIDERS[provider].models.find((m) => m.id === model)?.name}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Check className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
