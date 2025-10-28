"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCustomGPTs } from "@/hooks/useCustomGPTs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Pencil, Bot } from "lucide-react";
import type { UpdateCustomGPTRequest, CustomGPT } from "@deep-research/types";

const PROVIDERS = {
  openai: {
    name: "OpenAI",
    models: ["o3-mini", "gpt-4o", "gpt-4o-mini", "o1-mini"],
  },
  fireworks: {
    name: "Fireworks AI",
    models: [
      "accounts/fireworks/models/deepseek-r1",
      "accounts/fireworks/models/llama-v3p3-70b-instruct",
    ],
  },
  openrouter: {
    name: "OpenRouter",
    models: [
      "openai/gpt-4o",
      "anthropic/claude-3.5-sonnet",
      "google/gemini-2.0-flash-exp:free",
    ],
  },
};

export default function EditCustomGPTPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { customGPTs, loading: loadingGPTs, updateCustomGPT } = useCustomGPTs();
  const [loading, setLoading] = useState(false);
  const [customGPT, setCustomGPT] = useState<CustomGPT | null>(null);

  const [formData, setFormData] = useState<Partial<UpdateCustomGPTRequest>>({
    id,
    name: "",
    description: "",
    instructions: "",
    conversationStarters: [],
    settings: {
      temperature: 1,
    },
    capabilities: {
      webSearch: true,
      fileAnalysis: true,
      imageGeneration: false,
      codeInterpreter: false,
    },
  });

  const [conversationStarter, setConversationStarter] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");

  // Load custom GPT data
  useEffect(() => {
    const gpt = customGPTs.find((g) => g.id === id);
    if (gpt) {
      setCustomGPT(gpt);
      setFormData({
        id: gpt.id,
        name: gpt.name,
        description: gpt.description,
        instructions: gpt.instructions,
        conversationStarters: gpt.conversationStarters,
        settings: gpt.settings,
        capabilities: gpt.capabilities,
        avatar: gpt.avatar,
      });
      if (gpt.settings.recommendedModel) {
        setSelectedProvider(gpt.settings.recommendedModel.provider);
        setSelectedModel(gpt.settings.recommendedModel.model);
      }
    }
  }, [id, customGPTs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const request: Partial<UpdateCustomGPTRequest> = {
        ...formData,
        settings: {
          ...formData.settings,
          recommendedModel:
            selectedProvider && selectedModel
              ? {
                provider: selectedProvider as any,
                model: selectedModel,
              }
              : undefined,
        },
      };

      await updateCustomGPT(id, request);
      router.push(`/custom-gpts/${id}`);
    } catch (error) {
      console.error("Error updating custom GPT:", error);
    } finally {
      setLoading(false);
    }
  };

  const addConversationStarter = () => {
    if (conversationStarter.trim()) {
      setFormData({
        ...formData,
        conversationStarters: [
          ...(formData.conversationStarters || []),
          conversationStarter.trim(),
        ],
      });
      setConversationStarter("");
    }
  };

  const removeConversationStarter = (index: number) => {
    setFormData({
      ...formData,
      conversationStarters: formData.conversationStarters?.filter(
        (_, i) => i !== index
      ),
    });
  };

  if (loadingGPTs) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading custom GPT...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!customGPT) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Custom GPT not found</h2>
            <p className="text-muted-foreground mb-6">
              The custom GPT you're trying to edit doesn't exist.
            </p>
            <Button onClick={() => router.push("/custom-gpts")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Custom GPTs
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => router.push(`/custom-gpts/${id}`)}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Details
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Pencil className="h-8 w-8 text-primary" />
          Edit Custom GPT
        </h1>
        <p className="text-muted-foreground">
          Update your custom GPT's configuration and settings
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Update your custom GPT's name and description
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Research Assistant"
                required
                maxLength={100}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of what this GPT does"
                maxLength={500}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="avatar">Avatar (emoji)</Label>
              <Input
                id="avatar"
                value={formData.avatar || ""}
                onChange={(e) =>
                  setFormData({ ...formData, avatar: e.target.value })
                }
                placeholder="🤖"
                maxLength={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instructions *</CardTitle>
            <CardDescription>
              Define how your custom GPT should behave and respond
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.instructions}
              onChange={(e) =>
                setFormData({ ...formData, instructions: e.target.value })
              }
              placeholder="You are an expert research assistant. Your role is to..."
              required
              minLength={10}
              maxLength={10000}
              rows={10}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {formData.instructions?.length || 0} / 10,000 characters
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversation Starters</CardTitle>
            <CardDescription>
              Add example prompts to help users get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={conversationStarter}
                onChange={(e) => setConversationStarter(e.target.value)}
                placeholder="e.g., Help me research a topic"
                maxLength={200}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addConversationStarter();
                  }
                }}
              />
              <Button
                type="button"
                onClick={addConversationStarter}
                disabled={!conversationStarter.trim()}
              >
                Add
              </Button>
            </div>

            {formData.conversationStarters &&
              formData.conversationStarters.length > 0 && (
                <div className="space-y-2">
                  {formData.conversationStarters.map((starter, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <span className="text-sm">{starter}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeConversationStarter(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Model Settings</CardTitle>
            <CardDescription>
              Choose a recommended model and configure parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="provider">Provider</Label>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROVIDERS).map(([key, { name }]) => (
                      <SelectItem key={key} value={key}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="model">Model</Label>
                <Select
                  value={selectedModel}
                  onValueChange={setSelectedModel}
                  disabled={!selectedProvider}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedProvider &&
                      PROVIDERS[selectedProvider as keyof typeof PROVIDERS].models.map(
                        (model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        )
                      )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="temperature">
                Temperature: {formData.settings?.temperature || 1}
              </Label>
              <input
                type="range"
                id="temperature"
                min="0"
                max="2"
                step="0.1"
                value={formData.settings?.temperature || 1}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      temperature: parseFloat(e.target.value),
                    },
                  })
                }
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Lower values make output more focused, higher values more creative
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capabilities</CardTitle>
            <CardDescription>
              Enable or disable specific features for this GPT
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="webSearch"
                checked={formData.capabilities?.webSearch}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    capabilities: {
                      ...formData.capabilities!,
                      webSearch: checked as boolean,
                    },
                  })
                }
              />
              <Label htmlFor="webSearch" className="cursor-pointer">
                Web Search (Firecrawl)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="fileAnalysis"
                checked={formData.capabilities?.fileAnalysis}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    capabilities: {
                      ...formData.capabilities!,
                      fileAnalysis: checked as boolean,
                    },
                  })
                }
              />
              <Label htmlFor="fileAnalysis" className="cursor-pointer">
                File Analysis
              </Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/custom-gpts/${id}`)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
