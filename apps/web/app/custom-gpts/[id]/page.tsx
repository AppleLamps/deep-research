"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCustomGPTs, useActiveCustomGPT } from "@/hooks/useCustomGPTs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Bot,
  Pencil,
  Trash2,
  Copy,
  FileText,
  Settings,
  MessageSquare,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import type { CustomGPT, KnowledgeFile } from "@deep-research/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function CustomGPTDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const {
    customGPTs,
    loading,
    deleteCustomGPT,
    duplicateCustomGPT,
    uploadKnowledgeFile,
    deleteKnowledgeFile,
  } = useCustomGPTs();
  const { setActiveCustomGPT } = useActiveCustomGPT("chat");

  const [customGPT, setCustomGPT] = useState<CustomGPT | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteFileDialogOpen, setDeleteFileDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const gpt = customGPTs.find((g) => g.id === id);
    setCustomGPT(gpt || null);
  }, [id, customGPTs]);

  const handleDelete = async () => {
    await deleteCustomGPT(id);
    setDeleteDialogOpen(false);
    router.push("/custom-gpts");
  };

  const handleDuplicate = async () => {
    const newGPT = await duplicateCustomGPT(id);
    router.push(`/custom-gpts/${newGPT.id}`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Unsupported file type. Please upload PDF, TXT, MD, DOC, or DOCX files.");
      return;
    }

    setUploading(true);
    try {
      await uploadKnowledgeFile(id, file);
      // Reset file input
      e.target.value = "";
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async () => {
    if (!fileToDelete) return;
    await deleteKnowledgeFile(id, fileToDelete);
    setDeleteFileDialogOpen(false);
    setFileToDelete(null);
  };

  const handleChatWithGPT = async () => {
    await setActiveCustomGPT(id);
    toast.success(`Activated ${customGPT?.name}`);
    router.push("/");
  };

  if (loading) {
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
              The custom GPT you're looking for doesn't exist.
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
    <div className="container mx-auto py-8 max-w-5xl">
      <Button
        variant="ghost"
        onClick={() => router.push("/custom-gpts")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Custom GPTs
      </Button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            {customGPT.avatar ? (
              <div className="text-5xl">{customGPT.avatar}</div>
            ) : (
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-8 w-8 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold mb-2">{customGPT.name}</h1>
              <p className="text-muted-foreground">{customGPT.description}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/custom-gpts/${id}/edit`)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" onClick={handleDuplicate}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Chat with GPT Button */}
        <Button
          onClick={handleChatWithGPT}
          size="lg"
          className="w-full"
        >
          <MessageSquare className="mr-2 h-5 w-5" />
          Chat with this GPT
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-md">
              {customGPT.instructions}
            </div>
          </CardContent>
        </Card>

        {/* Conversation Starters */}
        {customGPT.conversationStarters.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Conversation Starters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {customGPT.conversationStarters.map((starter, index) => (
                  <div
                    key={index}
                    className="p-3 bg-muted rounded-md text-sm"
                  >
                    {starter}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customGPT.settings.recommendedModel && (
              <div>
                <Label className="text-muted-foreground">Recommended Model</Label>
                <div className="mt-1">
                  <Badge variant="secondary">
                    {customGPT.settings.recommendedModel.provider} /{" "}
                    {customGPT.settings.recommendedModel.model}
                  </Badge>
                </div>
              </div>
            )}
            <div>
              <Label className="text-muted-foreground">Temperature</Label>
              <p className="mt-1">{customGPT.settings.temperature ?? 1}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Capabilities</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {customGPT.capabilities.webSearch && (
                  <Badge>Web Search</Badge>
                )}
                {customGPT.capabilities.fileAnalysis && (
                  <Badge>File Analysis</Badge>
                )}
                {customGPT.capabilities.imageGeneration && (
                  <Badge>Image Generation</Badge>
                )}
                {customGPT.capabilities.codeInterpreter && (
                  <Badge>Code Interpreter</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Knowledge Files */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Knowledge Base ({customGPT.knowledgeFiles.length})
              </CardTitle>
              <Button variant="outline" size="sm" disabled={uploading} asChild>
                <label className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload File"}
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.txt,.md,.doc,.docx"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
              </Button>
            </div>
            <CardDescription>
              Upload documents to enhance your custom GPT's knowledge
            </CardDescription>
          </CardHeader>
          <CardContent>
            {customGPT.knowledgeFiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No knowledge files uploaded yet
              </div>
            ) : (
              <div className="space-y-2">
                {customGPT.knowledgeFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(2)} KB •{" "}
                          {new Date(file.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setFileToDelete(file.id);
                        setDeleteFileDialogOpen(true);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete GPT Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Custom GPT</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{customGPT.name}"? This action
              cannot be undone and will delete all associated knowledge files.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete File Dialog */}
      <AlertDialog open={deleteFileDialogOpen} onOpenChange={setDeleteFileDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Knowledge File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this file? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFile} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

