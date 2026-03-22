import React, { useState } from "react";
import { Annotation, AnnotationType, AnnotationPayload } from "../../shared/annotations";
import { useAnnotations } from "./AnnotationContext";

interface Props {
  documentName: string;
  documentPath: string;
  onClose: () => void;
}

const TYPE_BADGES: Record<AnnotationType, { label: string; className: string }> = {
  [AnnotationType.COMMENT]: { label: "Comment", className: "bg-blue-900/40 text-blue-400" },
  [AnnotationType.NEEDS_UPDATE]: { label: "Needs Update", className: "bg-yellow-900/40 text-yellow-400" },
  [AnnotationType.DELETION]: { label: "Delete", className: "bg-red-900/40 text-red-400" },
  [AnnotationType.GLOBAL]: { label: "Global", className: "bg-zinc-700 text-zinc-300" },
};

export function AnnotationPanel({ documentName, documentPath, onClose }: Props) {
  const { annotations, removeAnnotation, clearAnnotations } = useAnnotations();
  const [globalFeedback, setGlobalFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const docAnnotations = annotations.filter((a) => a.documentPath === documentPath);

  // Group by section
  const grouped = new Map<string, Annotation[]>();
  for (const a of docAnnotations) {
    const key = a.sectionHeading;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(a);
  }

  const handleSubmit = async () => {
    if (docAnnotations.length === 0 && !globalFeedback.trim()) return;

    setSubmitting(true);
    try {
      const payload: AnnotationPayload = {
        documentName,
        documentPath,
        annotations: docAnnotations,
        globalFeedback: globalFeedback.trim() || undefined,
        timestamp: new Date().toISOString(),
      };

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Failed (${res.status})`);
      setSubmitted(true);
      clearAnnotations();
    } catch {
      // Keep panel open on error
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <aside className="flex h-full w-80 flex-shrink-0 flex-col border-l border-zinc-800 bg-zinc-900">
        <div className="flex flex-col items-center justify-center gap-3 p-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-900/30">
            <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-zinc-200">Feedback Sent</p>
          <p className="text-center text-xs text-zinc-500">Claude will process your annotations on the next sync.</p>
          <button onClick={onClose} className="mt-2 text-xs text-indigo-400 hover:text-indigo-300">
            Close Panel
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-80 flex-shrink-0 flex-col border-l border-zinc-800 bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Annotations</h3>
          <p className="text-[10px] text-zinc-500">{docAnnotations.length} annotation{docAnnotations.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={onClose} className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Annotation list */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {docAnnotations.length === 0 ? (
          <div className="mt-8 text-center">
            <p className="text-xs text-zinc-500">No annotations yet.</p>
            <p className="mt-1 text-[10px] text-zinc-600">
              Click the comment icon next to any heading to add one.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.from(grouped.entries()).map(([section, items]) => (
              <div key={section}>
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  {section}
                </div>
                <div className="space-y-2">
                  {items.map((a) => {
                    const badge = TYPE_BADGES[a.type];
                    return (
                      <div key={a.id} className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-2.5">
                        <div className="mb-1 flex items-center justify-between">
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${badge.className}`}>
                            {badge.label}
                          </span>
                          <button
                            onClick={() => removeAnnotation(a.id)}
                            className="rounded p-0.5 text-zinc-600 hover:text-red-400"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        {a.selectedText && (
                          <div className="mb-1.5 rounded border-l-2 border-indigo-500 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-500 italic">
                            "{a.selectedText}"
                          </div>
                        )}
                        <p className="text-xs text-zinc-300">{a.comment}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Global feedback + submit */}
      <div className="border-t border-zinc-800 p-3">
        <textarea
          value={globalFeedback}
          onChange={(e) => setGlobalFeedback(e.target.value)}
          placeholder="Additional feedback..."
          className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-indigo-500"
          rows={2}
        />
        <button
          onClick={handleSubmit}
          disabled={submitting || (docAnnotations.length === 0 && !globalFeedback.trim())}
          className="mt-2 w-full rounded-lg bg-indigo-600 py-2 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-40"
        >
          {submitting ? "Sending..." : "Submit All Feedback"}
        </button>
      </div>
    </aside>
  );
}
