import React, { useState } from "react";
import { ReadinessScore } from "./ReadinessScore";

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

interface ReadinessItem {
  docType: string;
  label: string;
  status: "complete" | "partial" | "missing" | "stale";
  detail?: string;
}

interface Props {
  documents: DocEntry[];
  flows: FlowEntry[];
  selectedDoc: string | null;
  onSelectDoc: (path: string) => void;
  readinessScore: number;
  readinessItems: ReadinessItem[];
  documentStatus: Record<string, { complete: boolean; lastUpdated: string }>;
}

const DOC_ICONS: Record<string, string> = {
  prd: "\uD83D\uDCCB",
  architecture: "\uD83C\uDFD7",
  database: "\uD83D\uDDC4",
  api: "\uD83D\uDD0C",
  flows: "\uD83D\uDD04",
  "tech-stack": "\u2699",
  deployment: "\uD83D\uDE80",
  models: "\uD83D\uDCE6",
  integrations: "\uD83D\uDD17",
  config: "\uD83D\uDD10",
  "executive-summary": "\uD83D\uDCCA",
  decisions: "\uD83D\uDCDD",
  changelog: "\uD83D\uDCDC",
};

function getDocIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(DOC_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return "\uD83D\uDCC4";
}

function getFreshnessDot(lastModified: string): string {
  try {
    const date = new Date(lastModified);
    const diffMs = Date.now() - date.getTime();
    const diffDays = diffMs / 86400000;
    if (diffDays < 1) return "bg-green-500";
    if (diffDays < 7) return "bg-yellow-500";
    return "bg-red-500";
  } catch {
    return "bg-red-500";
  }
}

export function Sidebar({
  documents,
  flows,
  selectedDoc,
  onSelectDoc,
  readinessScore,
  readinessItems,
  documentStatus,
}: Props) {
  const [flowsExpanded, setFlowsExpanded] = useState(false);

  // Separate flow documents from regular documents
  const regularDocs = documents.filter(
    (d) => !d.path.toLowerCase().includes("flow")
  );

  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col border-r border-zinc-800 bg-zinc-900">
      {/* Logo / Title */}
      <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
          <svg
            className="h-5 w-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-sm font-bold text-zinc-100">BluePrintMe</h1>
          <span className="text-[10px] text-zinc-500">v0.1.0</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Documents
        </div>

        <ul className="space-y-0.5">
          {regularDocs.map((doc) => {
            const isActive = selectedDoc === doc.path;
            const icon = getDocIcon(doc.name);
            const dotColor = getFreshnessDot(doc.lastModified);

            return (
              <li key={doc.path}>
                <button
                  onClick={() => onSelectDoc(doc.path)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    isActive
                      ? "bg-indigo-600/15 text-indigo-300"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  <span className="flex-shrink-0 text-base">{icon}</span>
                  <span className="flex-1 truncate">{doc.name}</span>
                  <span
                    className={`h-2 w-2 flex-shrink-0 rounded-full ${dotColor}`}
                  />
                </button>
              </li>
            );
          })}

          {/* Flows section */}
          {flows.length > 0 && (
            <li>
              <button
                onClick={() => setFlowsExpanded(!flowsExpanded)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  flowsExpanded
                    ? "text-zinc-200"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                }`}
              >
                <span className="flex-shrink-0 text-base">{DOC_ICONS.flows}</span>
                <span className="flex-1">Flows</span>
                <svg
                  className={`h-4 w-4 flex-shrink-0 text-zinc-500 transition-transform ${
                    flowsExpanded ? "rotate-90" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              {flowsExpanded && (
                <ul className="ml-5 mt-0.5 space-y-0.5 border-l border-zinc-800 pl-3">
                  {flows.map((flow) => {
                    const isActive = selectedDoc === flow.path;
                    const dotColor = getFreshnessDot(flow.lastModified);

                    return (
                      <li key={flow.path}>
                        <button
                          onClick={() => onSelectDoc(flow.path)}
                          className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors ${
                            isActive
                              ? "bg-indigo-600/15 text-indigo-300"
                              : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                          }`}
                        >
                          <span className="flex-1 truncate">{flow.name}</span>
                          <span
                            className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${dotColor}`}
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          )}
        </ul>
      </nav>

      {/* Readiness Score */}
      <ReadinessScore score={readinessScore} items={readinessItems} />
    </aside>
  );
}
