import React, { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  content: string;
  lastModified?: string;
}

type Persona = "technical" | "non-technical" | "top-management";

const PERSONA_CONFIG: Record<
  Persona,
  { label: string; description: string; sectionHeader: string }
> = {
  technical: {
    label: "Technical",
    description: "For developers & architects",
    sectionHeader: "## Technical",
  },
  "non-technical": {
    label: "Non-Technical",
    description: "For product & marketing",
    sectionHeader: "## Non-Technical",
  },
  "top-management": {
    label: "Top Management",
    description: "For C-suite & board",
    sectionHeader: "## Top Management",
  },
};

function parsePersonaSections(
  content: string
): Record<Persona, string> {
  const result: Record<Persona, string> = {
    technical: "",
    "non-technical": "",
    "top-management": "",
  };

  const personas: Persona[] = ["technical", "non-technical", "top-management"];

  for (const persona of personas) {
    const header = PERSONA_CONFIG[persona].sectionHeader;
    const headerIndex = content.indexOf(header);

    if (headerIndex === -1) {
      // Try case-insensitive search
      const lowerContent = content.toLowerCase();
      const lowerHeader = header.toLowerCase();
      const altIndex = lowerContent.indexOf(lowerHeader);
      if (altIndex === -1) continue;

      const startIndex = altIndex + header.length;
      const nextSectionMatch = content
        .slice(startIndex)
        .match(/\n## /);
      const endIndex = nextSectionMatch
        ? startIndex + nextSectionMatch.index!
        : content.length;

      result[persona] = content.slice(startIndex, endIndex).trim();
    } else {
      const startIndex = headerIndex + header.length;
      const nextSectionMatch = content
        .slice(startIndex)
        .match(/\n## /);
      const endIndex = nextSectionMatch
        ? startIndex + nextSectionMatch.index!
        : content.length;

      result[persona] = content.slice(startIndex, endIndex).trim();
    }
  }

  return result;
}

export function ExecutiveSummary({ content, lastModified }: Props) {
  const [activePersona, setActivePersona] = useState<Persona>("technical");
  const sections = useMemo(() => parsePersonaSections(content), [content]);

  const hasAnySections =
    sections.technical || sections["non-technical"] || sections["top-management"];

  // If no persona sections found, render the whole document normally
  if (!hasAnySections) {
    return (
      <div className="blueprint-prose">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    );
  }

  const activeContent = sections[activePersona];

  return (
    <div>
      {/* Persona tabs */}
      <div className="mb-6 flex gap-2">
        {(Object.keys(PERSONA_CONFIG) as Persona[]).map((persona) => {
          const config = PERSONA_CONFIG[persona];
          const isActive = activePersona === persona;
          const hasContent = !!sections[persona];

          return (
            <button
              key={persona}
              onClick={() => setActivePersona(persona)}
              disabled={!hasContent}
              className={`flex flex-col items-start rounded-lg border px-4 py-3 text-left transition-all ${
                isActive
                  ? "border-indigo-500/50 bg-indigo-950/30 shadow-lg shadow-indigo-500/5"
                  : hasContent
                    ? "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900"
                    : "cursor-not-allowed border-zinc-800/50 bg-zinc-900/20 opacity-40"
              }`}
            >
              <span
                className={`text-sm font-semibold ${
                  isActive ? "text-indigo-300" : "text-zinc-300"
                }`}
              >
                {config.label}
              </span>
              <span
                className={`mt-0.5 text-xs ${
                  isActive ? "text-indigo-400/70" : "text-zinc-500"
                }`}
              >
                {config.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeContent ? (
        <div className="blueprint-prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {activeContent}
          </ReactMarkdown>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/30 py-12">
          <svg
            className="mb-3 h-10 w-10 text-zinc-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          <p className="text-sm text-zinc-500">
            No content available for this persona view.
          </p>
        </div>
      )}
    </div>
  );
}
