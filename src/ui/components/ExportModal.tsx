import React, { useState } from "react";
import JSZip from "jszip";

interface DocEntry {
  name: string;
  path: string;
  content: string;
  lastModified: string;
}

interface Props {
  documents: DocEntry[];
  flows: DocEntry[];
  projectName: string;
  readinessScore: number;
  onClose: () => void;
}

type ExportStep = "choose" | "select-docs";

export function ExportModal({ documents, flows, projectName, readinessScore, onClose }: Props) {
  const [exporting, setExporting] = useState(false);
  const [step, setStep] = useState<ExportStep>("choose");

  const allDocs = [...documents, ...flows];
  const [selected, setSelected] = useState<Set<string>>(() => new Set(allDocs.map((d) => d.path)));

  const toggleDoc = (path: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(allDocs.map((d) => d.path)));
  const selectNone = () => setSelected(new Set());

  const handleExportZip = async () => {
    setExporting(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("blueprint")!;
      for (const doc of allDocs) {
        const fileName = doc.path.replace(/^\.blueprint\//, "");
        folder.file(fileName, doc.content);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName}-blueprint.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = () => {
    const selectedDocs = allDocs.filter((d) => selected.has(d.path));
    if (selectedDocs.length === 0) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const coverDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const docSections = selectedDocs
      .map(
        (doc) => `
        <div class="doc-section">
          <div class="doc-header">
            <h2>${doc.name}</h2>
            <span class="doc-path">${doc.path}</span>
          </div>
          <div class="doc-content" data-doc="${doc.name}">
            ${markdownToHtml(doc.content)}
          </div>
        </div>
      `
      )
      .join("\n");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${projectName} — Product Blueprint</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1a1a2e;
      line-height: 1.6;
      background: #fff;
    }

    /* Cover page */
    .cover {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4338ca 60%, #6366f1 100%);
      color: white;
      text-align: center;
      page-break-after: always;
    }
    .cover-icon {
      width: 80px;
      height: 80px;
      background: rgba(255,255,255,0.15);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 2rem;
      font-size: 40px;
    }
    .cover h1 {
      font-size: 3rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 0.5rem;
    }
    .cover .subtitle {
      font-size: 1.25rem;
      font-weight: 300;
      opacity: 0.85;
      margin-bottom: 3rem;
    }
    .cover .meta {
      font-size: 0.875rem;
      opacity: 0.6;
    }
    .cover .score {
      margin-top: 2rem;
      padding: 1rem 2rem;
      background: rgba(255,255,255,0.1);
      border-radius: 12px;
      font-size: 0.9rem;
    }
    .cover .score strong {
      font-size: 2rem;
      font-weight: 700;
    }

    /* Table of contents */
    .toc {
      padding: 3rem;
      page-break-after: always;
    }
    .toc h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #4338ca;
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #e0e7ff;
    }
    .toc ul {
      list-style: none;
    }
    .toc li {
      padding: 0.6rem 0;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .toc li .num {
      width: 28px;
      height: 28px;
      background: #eef2ff;
      color: #4338ca;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
      flex-shrink: 0;
    }
    .toc li span {
      font-size: 0.95rem;
      color: #334155;
    }

    /* Document sections */
    .doc-section {
      padding: 3rem;
      page-break-before: always;
    }
    .doc-header {
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 3px solid #4338ca;
    }
    .doc-header h2 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e1b4b;
      text-transform: capitalize;
    }
    .doc-path {
      font-size: 0.75rem;
      color: #94a3b8;
      font-family: monospace;
    }

    /* Markdown content styling */
    .doc-content h1 { font-size: 1.5rem; font-weight: 700; color: #1e1b4b; margin: 2rem 0 1rem; }
    .doc-content h2 { font-size: 1.25rem; font-weight: 600; color: #312e81; margin: 1.75rem 0 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid #e2e8f0; }
    .doc-content h3 { font-size: 1.1rem; font-weight: 600; color: #4338ca; margin: 1.5rem 0 0.5rem; }
    .doc-content h4 { font-size: 1rem; font-weight: 600; color: #475569; margin: 1.25rem 0 0.5rem; }
    .doc-content p { margin: 0.75rem 0; color: #334155; }
    .doc-content ul, .doc-content ol { margin: 0.75rem 0; padding-left: 1.5rem; color: #334155; }
    .doc-content li { margin: 0.25rem 0; }
    .doc-content strong { font-weight: 600; color: #1e1b4b; }
    .doc-content em { font-style: italic; color: #475569; }
    .doc-content code {
      background: #f1f5f9;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-size: 0.85em;
      font-family: 'SF Mono', Monaco, monospace;
      color: #4338ca;
    }
    .doc-content pre:not(.mermaid) {
      background: #1e1b4b;
      color: #e2e8f0;
      padding: 1rem 1.25rem;
      border-radius: 8px;
      overflow-x: auto;
      margin: 1rem 0;
      font-size: 0.85rem;
      line-height: 1.5;
    }
    .doc-content pre:not(.mermaid) code {
      background: none;
      color: inherit;
      padding: 0;
    }
    .doc-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
      font-size: 0.9rem;
    }
    .doc-content th {
      background: #eef2ff;
      color: #312e81;
      font-weight: 600;
      text-align: left;
      padding: 0.6rem 0.75rem;
      border: 1px solid #c7d2fe;
    }
    .doc-content td {
      padding: 0.5rem 0.75rem;
      border: 1px solid #e2e8f0;
      color: #334155;
    }
    .doc-content tr:nth-child(even) td {
      background: #f8fafc;
    }
    .doc-content blockquote {
      border-left: 3px solid #6366f1;
      padding: 0.5rem 1rem;
      margin: 1rem 0;
      background: #eef2ff;
      color: #4338ca;
      border-radius: 0 6px 6px 0;
    }
    .doc-content hr {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 2rem 0;
    }
    .doc-content a {
      color: #4338ca;
      text-decoration: underline;
    }
    .doc-content img, .doc-content svg {
      max-width: 100%;
      height: auto;
    }

    /* Mermaid diagrams — blueprint style */
    .mermaid {
      background-color: #2854a0;
      background-image:
        repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(255,255,255,0.08) 19px, rgba(255,255,255,0.08) 20px),
        repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(255,255,255,0.08) 19px, rgba(255,255,255,0.08) 20px),
        radial-gradient(ellipse at center, #3568b8 0%, #2854a0 50%, #1a3a6c 100%);
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 8px;
      padding: 1.5rem;
      margin: 1rem 0;
      text-align: center;
      overflow-x: auto;
    }
    .mermaid svg {
      max-width: 100%;
      height: auto;
    }
    .mermaid svg text,
    .mermaid svg .nodeLabel,
    .mermaid svg .label,
    .mermaid svg .edgeLabel,
    .mermaid svg .cluster-label,
    .mermaid svg tspan {
      fill: #ffffff !important;
      color: #ffffff !important;
    }

    /* Download button */
    .download-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 2rem;
      background: #1e1b4b;
      color: white;
      font-size: 0.875rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    .download-bar span {
      opacity: 0.7;
      font-size: 0.8rem;
    }
    .download-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #6366f1;
      color: white;
      border: none;
      padding: 0.5rem 1.25rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
    }
    .download-btn:hover { background: #4f46e5; }

    /* Print optimizations */
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .cover { height: 100vh; }
      .doc-section { page-break-before: always; }
      .no-break { page-break-inside: avoid; }
      .download-bar { display: none !important; }
    }

    /* Footer */
    .page-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 0.5rem 3rem;
      font-size: 0.7rem;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #f1f5f9;
    }
  </style>
</head>
<body>
  <!-- Download Bar -->
  <div class="download-bar">
    <span>${projectName} — Product Blueprint</span>
    <button class="download-btn" onclick="window.print()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      Download PDF
    </button>
  </div>

  <!-- Cover Page -->
  <div class="cover" style="margin-top: 52px;">
    <div class="cover-icon">&#x1F3D7;</div>
    <h1>${projectName}</h1>
    <div class="subtitle">Product Blueprint</div>
    <div class="meta">${coverDate}</div>
    <div class="score">
      Rebuild Readiness Score<br>
      <strong>${readinessScore}%</strong>
    </div>
  </div>

  <!-- Table of Contents -->
  <div class="toc">
    <h2>Table of Contents</h2>
    <ul>
      ${selectedDocs
        .map(
          (doc, i) => `
        <li>
          <span class="num">${i + 1}</span>
          <span>${doc.name}</span>
        </li>
      `
        )
        .join("\n")}
    </ul>
  </div>

  <!-- Documents -->
  ${docSections}

  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      securityLevel: 'loose',
      themeVariables: {
        primaryColor: '#2854a0',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#ffffff',
        lineColor: '#ffffff',
        secondaryColor: '#1e4480',
        tertiaryColor: '#1a3a6c',
        background: '#2854a0',
        mainBkg: '#2854a0',
        nodeBorder: '#ffffff',
        clusterBkg: '#1e4480',
        clusterBorder: '#ffffff',
        titleColor: '#ffffff',
        edgeLabelBackground: '#2854a0',
        actorBkg: '#2854a0',
        actorBorder: '#ffffff',
        actorTextColor: '#ffffff',
        actorLineColor: '#ffffff',
        signalColor: '#ffffff',
        signalTextColor: '#ffffff',
        noteBkgColor: '#1e4480',
        noteBorderColor: '#ffffff',
        noteTextColor: '#ffffff',
        labelBoxBkgColor: '#2854a0',
        labelBoxBorderColor: '#ffffff',
        labelTextColor: '#ffffff',
        loopTextColor: '#ffffff',
        relationColor: '#ffffff',
        relationLabelBackground: '#2854a0',
        relationLabelColor: '#ffffff',
      },
    });
    const diagrams = document.querySelectorAll('.mermaid');
    for (let i = 0; i < diagrams.length; i++) {
      const el = diagrams[i];
      try {
        const { svg } = await mermaid.render('mermaid-' + i, el.textContent.trim());
        el.innerHTML = svg;
        const svgEl = el.querySelector('svg');
        if (svgEl) {
          const styleEl = document.createElement('style');
          styleEl.textContent = 'text, tspan, .nodeLabel, .label, .edgeLabel, .cluster-label, foreignObject div, foreignObject span, foreignObject p { fill: #ffffff !important; color: #ffffff !important; }';
          svgEl.prepend(styleEl);
        }
        el.classList.add('rendered');
      } catch (e) {
        el.innerHTML = '<div style="padding:1rem;color:#94a3b8;font-style:italic;font-size:0.85rem;">Diagram could not be rendered</div>';
        el.classList.add('render-error');
      }
    }
  </script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    onClose();
  };

  // Step: select documents for PDF
  if (step === "select-docs") {
    const regularDocs = documents;
    const flowDocs = flows;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">Select Documents</h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                {selected.size} of {allDocs.length} selected
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Select all / none */}
          <div className="mb-3 flex gap-3 text-xs">
            <button onClick={selectAll} className="text-indigo-400 hover:text-indigo-300">
              Select All
            </button>
            <button onClick={selectNone} className="text-zinc-500 hover:text-zinc-300">
              Select None
            </button>
          </div>

          {/* Document list */}
          <div className="max-h-80 space-y-0.5 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-800/30 p-2">
            {regularDocs.length > 0 && (
              <>
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Documents
                </div>
                {regularDocs.map((doc) => (
                  <label
                    key={doc.path}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-zinc-800"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(doc.path)}
                      onChange={() => toggleDoc(doc.path)}
                      className="h-3.5 w-3.5 rounded border-zinc-600 bg-zinc-700 text-indigo-500 focus:ring-indigo-500/30"
                    />
                    <span className="text-sm text-zinc-300">{doc.name}</span>
                  </label>
                ))}
              </>
            )}

            {flowDocs.length > 0 && (
              <>
                <div className="mt-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Flows
                </div>
                {flowDocs.map((doc) => (
                  <label
                    key={doc.path}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-zinc-800"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(doc.path)}
                      onChange={() => toggleDoc(doc.path)}
                      className="h-3.5 w-3.5 rounded border-zinc-600 bg-zinc-700 text-indigo-500 focus:ring-indigo-500/30"
                    />
                    <span className="text-sm text-zinc-300">{doc.name}</span>
                  </label>
                ))}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => setStep("choose")}
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              Back
            </button>
            <button
              onClick={handleExportPdf}
              disabled={selected.size === 0}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-40"
            >
              Generate PDF ({selected.size})
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step: choose export type
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">Export Blueprint</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {/* PDF Option */}
          <button
            onClick={() => setStep("select-docs")}
            className="flex w-full items-center gap-4 rounded-lg border border-zinc-700 bg-zinc-800 p-4 text-left transition-colors hover:border-indigo-500/50 hover:bg-zinc-800/80"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-900/30">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-zinc-100">Export as PDF</div>
              <div className="text-xs text-zinc-400">
                Select documents to include in a styled PDF package
              </div>
            </div>
          </button>

          {/* ZIP Option */}
          <button
            onClick={handleExportZip}
            disabled={exporting}
            className="flex w-full items-center gap-4 rounded-lg border border-zinc-700 bg-zinc-800 p-4 text-left transition-colors hover:border-indigo-500/50 hover:bg-zinc-800/80 disabled:opacity-50"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-900/30">
              <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-zinc-100">
                {exporting ? "Generating..." : "Export as ZIP"}
              </div>
              <div className="text-xs text-zinc-400">
                Individual markdown files in a zip archive
              </div>
            </div>
          </button>
        </div>

        <p className="mt-4 text-center text-[11px] text-zinc-500">
          {allDocs.length} document{allDocs.length !== 1 ? "s" : ""} available
        </p>
      </div>
    </div>
  );
}

/** Simple markdown-to-HTML converter for the print page */
function markdownToHtml(md: string): string {
  const codeBlocks: string[] = [];
  let html = md.replace(/```\s*(\w*)\s*\n([\s\S]*?)```/g, (_, lang, code) => {
    const placeholder = `<!--CODEBLOCK_${codeBlocks.length}-->`;
    if (lang === "mermaid") {
      codeBlocks.push(`<pre class="mermaid">${code.trim()}</pre>`);
    } else {
      const escaped = code.trim().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      codeBlocks.push(`<pre><code>${escaped}</code></pre>`);
    }
    return placeholder;
  });

  html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  html = html.replace(/&lt;!--CODEBLOCK_(\d+)--&gt;/g, (_, i) => codeBlocks[parseInt(i)]);

  // Tables
  html = html.replace(/^(\|.+\|)\n(\|[\s:|-]+\|)\n((?:\|.+\|\n?)+)/gm, (_, header, sep, body) => {
    const ths = header.split("|").filter((c: string) => c.trim()).map((c: string) => `<th>${c.trim()}</th>`).join("");
    const rows = body.trim().split("\n").map((row: string) => {
      const tds = row.split("|").filter((c: string) => c.trim()).map((c: string) => `<td>${c.trim()}</td>`).join("");
      return `<tr>${tds}</tr>`;
    }).join("\n");
    return `<table><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table>`;
  });

  html = html.replace(/^#### (.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>");
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>");
  html = html.replace(/^---$/gm, "<hr>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/^(?!<[a-z])((?!<\/|<h|<p|<ul|<ol|<li|<pre|<table|<block|<hr|<div).+)$/gm, "<p>$1</p>");

  return html;
}
