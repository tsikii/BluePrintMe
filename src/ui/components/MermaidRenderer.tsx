import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  themeVariables: {
    primaryColor: "#6366f1",
    primaryTextColor: "#e4e4e7",
    primaryBorderColor: "#4f46e5",
    lineColor: "#71717a",
    secondaryColor: "#27272a",
    tertiaryColor: "#18181b",
    background: "#09090b",
    mainBkg: "#18181b",
    nodeBorder: "#4f46e5",
    clusterBkg: "#18181b",
    titleColor: "#e4e4e7",
    edgeLabelBackground: "#18181b",
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
      className="mermaid-container my-4 flex justify-center overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
