import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "base",
  themeVariables: {
    primaryColor: "#2854a0",
    primaryTextColor: "#ffffff",
    primaryBorderColor: "#ffffff",
    lineColor: "#ffffff",
    secondaryColor: "#1e4480",
    tertiaryColor: "#1a3a6c",
    background: "#2854a0",
    mainBkg: "#2854a0",
    nodeBorder: "#ffffff",
    clusterBkg: "#1e4480",
    clusterBorder: "#ffffff",
    titleColor: "#ffffff",
    edgeLabelBackground: "#2854a0",
    actorBkg: "#2854a0",
    actorBorder: "#ffffff",
    actorTextColor: "#ffffff",
    actorLineColor: "#ffffff",
    signalColor: "#ffffff",
    signalTextColor: "#ffffff",
    labelBoxBkgColor: "#2854a0",
    labelBoxBorderColor: "#ffffff",
    labelTextColor: "#ffffff",
    loopTextColor: "#ffffff",
    noteBkgColor: "#1e4480",
    noteBorderColor: "#ffffff",
    noteTextColor: "#ffffff",
    activationBkgColor: "#1e4480",
    activationBorderColor: "#ffffff",
    sequenceNumberColor: "#2854a0",
    sectionBkgColor: "#2854a0",
    altSectionBkgColor: "#1a3a6c",
    sectionBkgColor2: "#1e4480",
    taskBkgColor: "#2854a0",
    taskBorderColor: "#ffffff",
    taskTextColor: "#ffffff",
    activeTaskBkgColor: "#3568b8",
    activeTaskBorderColor: "#ffffff",
    gridColor: "#ffffff33",
    doneTaskBkgColor: "#1a3a6c",
    doneTaskBorderColor: "#ffffff",
    critBorderColor: "#ff6b6b",
    critBkgColor: "#4a1a1a",
    relationColor: "#ffffff",
    relationLabelBackground: "#2854a0",
    relationLabelColor: "#ffffff",
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
      className="mermaid-container my-4 flex justify-center overflow-x-auto rounded-lg border border-white/20 p-6 shadow-lg shadow-blue-950/50"
      style={{
        backgroundColor: "#2854a0",
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(255,255,255,0.08) 19px, rgba(255,255,255,0.08) 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(255,255,255,0.08) 19px, rgba(255,255,255,0.08) 20px), radial-gradient(ellipse at center, #3568b8 0%, #2854a0 50%, #1a3a6c 100%)",
      }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
