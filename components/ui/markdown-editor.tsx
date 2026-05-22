"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Eye, Edit } from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write your caption in Markdown...",
  className,
  rows = 6,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  const renderPreview = (text: string) => {
    if (!text.trim()) {
      return <div className="text-slate-500 italic">{placeholder}</div>;
    }

    // Simple markdown rendering without external dependencies
    const html = text
      // Headers
      .replace(
        /^### (.*$)/gim,
        "<h3 class='text-lg font-semibold text-white mt-2 mb-1'>$1</h3>"
      )
      .replace(
        /^## (.*$)/gim,
        "<h2 class='text-xl font-semibold text-white mt-3 mb-2'>$1</h2>"
      )
      .replace(
        /^# (.*$)/gim,
        "<h1 class='text-2xl font-bold text-white mt-4 mb-2'>$1</h1>"
      )
      // Bold
      .replace(
        /\*\*(.*?)\*\*/gim,
        "<strong class='font-semibold text-white'>$1</strong>"
      )
      .replace(
        /__(.*?)__/gim,
        "<strong class='font-semibold text-white'>$1</strong>"
      )
      // Italic
      .replace(/\*(.*?)\*/gim, "<em class='italic text-slate-200'>$1</em>")
      .replace(/_(.*?)_/gim, "<em class='italic text-slate-200'>$1</em>")
      // Links
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/gim,
        "<a href='$2' class='text-lime-400 hover:text-lime-300 underline' target='_blank' rel='noopener noreferrer'>$1</a>"
      )
      // Line breaks
      .replace(/\n/gim, "<br />");

    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm text-slate-300">Caption</label>
        <div className="flex gap-1 border border-slate-700 rounded-md overflow-hidden">
          <button
            type="button"
            onClick={() => setMode("edit")}
            className={cn(
              "px-2 py-1 text-xs flex items-center gap-1 transition-colors",
              mode === "edit"
                ? "bg-slate-700 text-white"
                : "bg-slate-800 text-slate-400 hover:text-slate-300"
            )}
          >
            <Edit className="h-3 w-3" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            className={cn(
              "px-2 py-1 text-xs flex items-center gap-1 transition-colors",
              mode === "preview"
                ? "bg-slate-700 text-white"
                : "bg-slate-800 text-slate-400 hover:text-slate-300"
            )}
          >
            <Eye className="h-3 w-3" />
            Preview
          </button>
        </div>
      </div>
      {mode === "edit" ? (
        <textarea
          className="w-full rounded-lg border border-slate-800 bg-slate-950/80 p-2 text-sm text-white focus:border-lime-400 focus:outline-none font-mono"
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <div className="w-full rounded-lg border border-slate-800 bg-slate-950/80 p-3 text-sm text-slate-200 min-h-[120px] prose prose-invert prose-sm max-w-none">
          {renderPreview(value)}
        </div>
      )}
      {/* <div className="text-xs text-slate-500">
        Supports Markdown: **bold**, *italic*, [links](url), # headers
      </div> */}
    </div>
  );
}
