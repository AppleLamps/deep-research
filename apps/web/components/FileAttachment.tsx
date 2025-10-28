"use client";

import { X, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FileAttachment as FileAttachmentType } from "@deep-research/types";
import Image from "next/image";

interface FileAttachmentProps {
  file: FileAttachmentType;
  onRemove?: () => void;
  showRemove?: boolean;
}

export function FileAttachment({
  file,
  onRemove,
  showRemove = true,
}: FileAttachmentProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Construct full URL for images
  const getImageUrl = (url: string): string => {
    if (url.startsWith("http")) return url;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3051";
    return `${API_URL}${url}`;
  };

  return (
    <div className="relative group">
      {file.type === "image" ? (
        <div className="relative w-24 h-24 rounded-lg overflow-hidden border bg-muted">
          <Image
            src={getImageUrl(file.url)}
            alt={file.name}
            fill
            className="object-cover"
            unoptimized
          />
          {showRemove && onRemove && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onRemove}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
            {file.name}
          </div>
        </div>
      ) : (
        <div className="relative flex items-center gap-2 p-2 rounded-lg border bg-muted max-w-xs">
          <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.size)}
            </p>
          </div>
          {showRemove && onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={onRemove}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface FileAttachmentListProps {
  files: FileAttachmentType[];
  onRemove?: (fileId: string) => void;
  showRemove?: boolean;
}

export function FileAttachmentList({
  files,
  onRemove,
  showRemove = true,
}: FileAttachmentListProps) {
  if (files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {files.map((file) => (
        <FileAttachment
          key={file.id}
          file={file}
          onRemove={onRemove ? () => onRemove(file.id) : undefined}
          showRemove={showRemove}
        />
      ))}
    </div>
  );
}
