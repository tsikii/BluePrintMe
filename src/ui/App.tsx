import React, { useState, useEffect, useCallback } from "react";
import { Sidebar } from "./components/Sidebar";
import { DocumentViewer } from "./components/DocumentViewer";
import { FeedbackModal } from "./components/FeedbackModal";
import { ExportModal } from "./components/ExportModal";

interface DocEntry {
  name: string;
  path: string;
  content: string;
  lastModified: string;
}

interface FlowEntry {
  name: string;
  path: string;
  content: string;
  lastModified: string;
}

interface Meta {
  lastSync: string;
  projectName: string;
  readinessScore: number;
  documentStatus: Record<string, { complete: boolean; lastUpdated: string }>;
}

interface ReadinessItem {
  docType: string;
  label: string;
  status: "complete" | "partial" | "missing" | "stale";
  detail?: string;
}

interface BlueprintData {
  documents: DocEntry[];
  flows: FlowEntry[];
  meta: Meta;
  readiness: { score: number; items: ReadinessItem[] };
}

function formatSyncTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Unknown";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "Unknown";
  }
}

export default function App() {
  const [blueprint, setBlueprint] = useState<BlueprintData | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [exportMode, setExportMode] = useState(false);

  const fetchBlueprint = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/blueprint");
      if (!res.ok) throw new Error(`Failed to fetch blueprint (${res.status})`);
      const data: BlueprintData = await res.json();
      setBlueprint(data);

      // Auto-select first document if none selected
      if (!selectedDoc && data.documents.length > 0) {
        setSelectedDoc(data.documents[0].path);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load blueprint");
    } finally {
      setLoading(false);
    }
  }, [selectedDoc]);

  useEffect(() => {
    fetchBlueprint();
  }, []);

  // Find the currently selected document
  const currentDoc = blueprint
    ? [...blueprint.documents, ...blueprint.flows].find(
        (d) => d.path === selectedDoc
      )
    : null;

  // Derive doc type from path for special rendering
  const docType = currentDoc
    ? currentDoc.path
        .split("/")
        .pop()
        ?.replace(/\.md$/, "")
        ?.toLowerCase() || ""
    : "";

  const handleExport = () => {
    setExportMode(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-indigo-500" />
            <div className="absolute inset-2 animate-spin rounded-full border-2 border-transparent border-b-indigo-400" style={{ animationDirection: "reverse", animationDuration: "0.6s" }} />
          </div>
          <p className="text-sm text-zinc-500">Loading blueprint...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-xl border border-red-900/50 bg-zinc-900 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-900/30">
            <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-zinc-100">Failed to Load</h2>
          <p className="text-sm text-zinc-400">{error}</p>
          <button
            onClick={() => fetchBlueprint()}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!blueprint) return null;

  const totalDocs = blueprint.documents.length + blueprint.flows.length;
  const pendingUpdates = blueprint.readiness.items.filter(
    (i) => i.status !== "complete"
  ).length;

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100">
      {/* Top bar */}
      <header className="flex flex-shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-6 py-3">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold text-zinc-200">
            {currentDoc ? currentDoc.name : blueprint.meta.projectName}
          </h2>
          {currentDoc && (
            <span className="text-xs text-zinc-500">
              Last modified: {formatSyncTime(currentDoc.lastModified)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-700"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
          <button
            onClick={() => setFeedbackMode(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-500"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Send Feedback
          </button>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          documents={blueprint.documents}
          flows={blueprint.flows}
          selectedDoc={selectedDoc}
          onSelectDoc={setSelectedDoc}
          readinessScore={blueprint.readiness.score}
          readinessItems={blueprint.readiness.items}
          documentStatus={blueprint.meta.documentStatus}
        />

        {/* Content area */}
        <main className="flex-1 overflow-y-auto">
          {currentDoc ? (
            <DocumentViewer
              name={currentDoc.name}
              content={currentDoc.content}
              lastModified={currentDoc.lastModified}
              docType={docType}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 ring-1 ring-zinc-800">
                <svg className="h-8 w-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <p className="mt-4 text-sm text-zinc-500">
                Select a document from the sidebar to view
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Status bar */}
      <footer className="flex flex-shrink-0 items-center justify-between border-t border-zinc-800 bg-zinc-900/30 px-6 py-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Last sync: {formatSyncTime(blueprint.meta.lastSync)}
          </span>
          <span className="text-[11px] text-zinc-600">|</span>
          <span className="text-[11px] text-zinc-500">
            {totalDocs} document{totalDocs !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {pendingUpdates > 0 && (
            <span className="flex items-center gap-1.5 text-[11px] text-yellow-500">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
              </svg>
              {pendingUpdates} pending update{pendingUpdates !== 1 ? "s" : ""}
            </span>
          )}
          <span className="text-[11px] text-zinc-600">
            {blueprint.meta.projectName}
          </span>
        </div>
      </footer>

      {/* Feedback Modal */}
      {feedbackMode && (
        <FeedbackModal
          onClose={() => setFeedbackMode(false)}
          documentName={currentDoc?.name}
        />
      )}

      {/* Export Modal */}
      {exportMode && blueprint && (
        <ExportModal
          documents={blueprint.documents}
          flows={blueprint.flows}
          projectName={blueprint.meta.projectName}
          readinessScore={blueprint.readiness.score}
          onClose={() => setExportMode(false)}
        />
      )}
    </div>
  );
}
