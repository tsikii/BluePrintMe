import React, { useState } from "react";

interface Props {
  onClose: () => void;
  documentName?: string;
}

export function FeedbackModal({ onClose, documentName }: Props) {
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!feedback.trim()) return;

    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedback: feedback.trim(),
          documentName: documentName || null,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to send feedback (${res.status})`);
      }

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send feedback");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-900/30">
              <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-100">Feedback Sent</h3>
            <p className="text-center text-sm text-zinc-400">
              Thank you for your feedback. It will be reviewed and incorporated into the next blueprint sync.
            </p>
            <button
              onClick={onClose}
              className="mt-2 rounded-lg bg-zinc-800 px-5 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">Send Feedback</h3>
            {documentName && (
              <p className="mt-0.5 text-xs text-zinc-500">
                Re: {documentName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Textarea */}
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Describe what needs to be updated, corrected, or added to the blueprint..."
          className="h-36 w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-500 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
          autoFocus
        />

        {/* Error */}
        {error && (
          <p className="mt-2 text-sm text-red-400">{error}</p>
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!feedback.trim() || sending}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sending...
              </span>
            ) : (
              "Send Feedback"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
