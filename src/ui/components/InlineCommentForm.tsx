import React, { useState } from "react";
import { AnnotationType } from "../../shared/annotations";
import { useAnnotations } from "./AnnotationContext";

interface Props {
  heading: string;
  sectionIndex: number;
  documentPath: string;
  selectedText?: string;
}

const TYPE_OPTIONS: { value: AnnotationType; label: string; color: string }[] = [
  { value: AnnotationType.COMMENT, label: "Comment", color: "bg-blue-600" },
  { value: AnnotationType.NEEDS_UPDATE, label: "Needs Update", color: "bg-yellow-600" },
  { value: AnnotationType.DELETION, label: "Delete", color: "bg-red-600" },
];

export function InlineCommentForm({ heading, sectionIndex, documentPath, selectedText }: Props) {
  const { addAnnotation, setActiveSection } = useAnnotations();
  const [type, setType] = useState<AnnotationType>(AnnotationType.COMMENT);
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    if (!comment.trim()) return;
    addAnnotation({
      type,
      sectionHeading: heading,
      sectionIndex,
      selectedText,
      comment: comment.trim(),
      documentPath,
    });
    setComment("");
    setType(AnnotationType.COMMENT);
  };

  const handleCancel = () => {
    setActiveSection(null);
    setComment("");
  };

  return (
    <div className="my-3 rounded-lg border border-zinc-700 bg-zinc-900 p-3">
      {selectedText && (
        <div className="mb-2 rounded border-l-2 border-indigo-500 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400 italic">
          "{selectedText}"
        </div>
      )}

      {/* Type selector */}
      <div className="mb-2 flex gap-1.5">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setType(opt.value)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              type === opt.value
                ? `${opt.color} text-white`
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Comment input */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Describe what needs to change..."
        className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 outline-none focus:border-indigo-500"
        rows={2}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
          if (e.key === "Escape") handleCancel();
        }}
      />

      {/* Actions */}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-zinc-600">Cmd+Enter to add</span>
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className="rounded-md px-3 py-1 text-xs text-zinc-400 hover:text-zinc-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!comment.trim()}
            className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
