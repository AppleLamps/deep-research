"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCustomGPTs, useActiveCustomGPT } from "@/hooks/useCustomGPTs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Bot, Plus, MoreVertical, Pencil, Copy, Trash2, FileText, ArrowLeft, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function CustomGPTsPage() {
  const router = useRouter();
  const { customGPTs, loading, deleteCustomGPT, duplicateCustomGPT } = useCustomGPTs();
  const { setActiveCustomGPT } = useActiveCustomGPT("chat");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gptToDelete, setGptToDelete] = useState<string | null>(null);

  const handleDelete = async () => {
    if (gptToDelete) {
      await deleteCustomGPT(gptToDelete);
      setDeleteDialogOpen(false);
      setGptToDelete(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    await duplicateCustomGPT(id);
  };

  const handleChatWithGPT = async (id: string, name: string) => {
    await setActiveCustomGPT(id);
    toast.success(`Activated ${name}`);
    router.push("/");
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading custom GPTs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="ghost"
        onClick={() => router.push("/")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Custom GPTs</h1>
          <p className="text-muted-foreground">
            Create and manage your personalized AI assistants
          </p>
        </div>
        <Button onClick={() => router.push("/custom-gpts/new")} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Create Custom GPT
        </Button>
      </div>

      {customGPTs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bot className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No custom GPTs yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Create your first custom GPT to get started. Add custom instructions,
              upload knowledge files, and configure settings to build your perfect AI
              assistant.
            </p>
            <Button onClick={() => router.push("/custom-gpts/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Custom GPT
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customGPTs.map((gpt) => (
            <Card key={gpt.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {gpt.avatar ? (
                      <div className="text-3xl">{gpt.avatar}</div>
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">{gpt.name}</CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {gpt.description}
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/custom-gpts/${gpt.id}/edit`)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(gpt.id)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setGptToDelete(gpt.id);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>
                      {gpt.knowledgeFiles.length} knowledge file
                      {gpt.knowledgeFiles.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {gpt.capabilities.webSearch && (
                      <Badge variant="secondary">Web Search</Badge>
                    )}
                    {gpt.capabilities.fileAnalysis && (
                      <Badge variant="secondary">File Analysis</Badge>
                    )}
                    {gpt.settings.recommendedModel && (
                      <Badge variant="outline">
                        {gpt.settings.recommendedModel.model}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => handleChatWithGPT(gpt.id, gpt.name)}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Chat
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push(`/custom-gpts/${gpt.id}`)}
                >
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Custom GPT</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this custom GPT? This action cannot be
              undone. All knowledge files will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

