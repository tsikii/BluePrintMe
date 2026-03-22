import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "base",
  themeVariables: {
    primaryColor: "#1a3a5c",
    primaryTextColor: "#d4e4f7",
    primaryBorderColor: "#4a9eff",
    lineColor: "#4a9eff",
    secondaryColor: "#1e4470",
    tertiaryColor: "#0f2a44",
    background: "#0a2540",
    mainBkg: "#1a3a5c",
    nodeBorder: "#4a9eff",
    clusterBkg: "#0f2a44",
    clusterBorder: "#2a6496",
    titleColor: "#d4e4f7",
    edgeLabelBackground: "#0a2540",
    actorBkg: "#1a3a5c",
    actorBorder: "#4a9eff",
    actorTextColor: "#d4e4f7",
    actorLineColor: "#4a9eff",
    signalColor: "#4a9eff",
    signalTextColor: "#d4e4f7",
    labelBoxBkgColor: "#1a3a5c",
    labelBoxBorderColor: "#4a9eff",
    labelTextColor: "#d4e4f7",
    loopTextColor: "#d4e4f7",
    noteBkgColor: "#1e4470",
    noteBorderColor: "#4a9eff",
    noteTextColor: "#d4e4f7",
    activationBkgColor: "#1e4470",
    activationBorderColor: "#4a9eff",
    sequenceNumberColor: "#0a2540",
    sectionBkgColor: "#1a3a5c",
    altSectionBkgColor: "#0f2a44",
    sectionBkgColor2: "#1e4470",
    taskBkgColor: "#1a3a5c",
    taskBorderColor: "#4a9eff",
    taskTextColor: "#d4e4f7",
    activeTaskBkgColor: "#2a6496",
    activeTaskBorderColor: "#4a9eff",
    gridColor: "#2a6496",
    doneTaskBkgColor: "#0f2a44",
    doneTaskBorderColor: "#4a9eff",
    critBorderColor: "#ff6b6b",
    critBkgColor: "#4a1a1a",
    relationColor: "#4a9eff",
    relationLabelBackground: "#0a2540",
    relationLabelColor: "#d4e4f7",
  },
  fontFamily: "'Inter', sans-serif",
});

interface Props {
  code: string;
  id: string;
}

export function MermaidRenderer({ code, id }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      try {
        const uniqueId = `mermaid-${id}-${Date.now()}`;
        const { svg } = await mermaid.render(uniqueId, code.trim());
        if (!cancelled) {
          setSvgContent(svg);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to render diagram");
          setSvgContent("");
        }
        // Clean up any leftover error elements mermaid might have injected
        const errorEl = document.getElementById(`d${id}`);
        if (errorEl) errorEl.remove();
      }
    }

    renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [code, id]);

  if (error) {
    return (
      <div className="my-4 rounded-lg border border-red-900/50 bg-red-950/20 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-red-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Diagram render error
        </div>
        <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-xs text-zinc-400">
          <code>{code}</code>
        </pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-container my-4 flex justify-center overflow-x-auto rounded-lg border border-[#2a6496] bg-[#0a2540] p-6 shadow-lg shadow-blue-950/50"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
