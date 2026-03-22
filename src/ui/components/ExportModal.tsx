import React, { useState } from "react";
import JSZip from "jszip";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MermaidRenderer } from "./MermaidRenderer";

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

export function ExportModal({ documents, flows, projectName, readinessScore, onClose }: Props) {
  const [exporting, setExporting] = useState(false);

  const allDocs = [...documents, ...flows];

  const handleExportZip = async () => {
    setExporting(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("blueprint")!;
      for (const doc of allDocs) {
        // Preserve directory structure (e.g. .blueprint/flows/auth.md)
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

  let mermaidCounter = 0;

  const handleExportPdf = () => {
    // Build a new window with all docs styled for print
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // We'll render a styled HTML page and trigger print
    const coverDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Render all mermaid blocks to SVG first, then build the page
    // For simplicity, we'll use the rendered content from the current DOM
    // and build a print-optimized page
    const docSections = allDocs.map((doc) => {
      return `
        <div class="doc-section">
          <div class="doc-header">
            <h2>${doc.name}</h2>
            <span class="doc-path">${doc.path}</span>
          </div>
          <div class="doc-content" data-doc="${doc.name}">
            ${markdownToHtml(doc.content)}
          </div>
        </div>
      `;
    }).join("\n");

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

    /* Mermaid diagrams */
    .mermaid {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
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

    /* Print optimizations */
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .cover { height: 100vh; }
      .doc-section { page-break-before: always; }
      .no-break { page-break-inside: avoid; }
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
  <!-- Cover Page -->
  <div class="cover">
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
      ${allDocs.map((doc, i) => `
        <li>
          <span class="num">${i + 1}</span>
          <span>${doc.name}</span>
        </li>
      `).join("\n")}
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
        primaryColor: '#eef2ff',
        primaryTextColor: '#1e1b4b',
        primaryBorderColor: '#6366f1',
        lineColor: '#6366f1',
        secondaryColor: '#f0fdf4',
        tertiaryColor: '#fefce8',
        background: '#ffffff',
        mainBkg: '#eef2ff',
        nodeBorder: '#6366f1',
        clusterBkg: '#f8fafc',
        titleColor: '#1e1b4b',
        edgeLabelBackground: '#ffffff',
        actorBkg: '#eef2ff',
        actorBorder: '#6366f1',
        actorTextColor: '#1e1b4b',
        signalColor: '#1e1b4b',
        signalTextColor: '#1e1b4b',
      },
    });
    // Render each diagram individually so one failure doesn't block the rest
    const diagrams = document.querySelectorAll('.mermaid');
    for (let i = 0; i < diagrams.length; i++) {
      const el = diagrams[i];
      try {
        const { svg } = await mermaid.render('mermaid-' + i, el.textContent.trim());
        el.innerHTML = svg;
        el.classList.add('rendered');
      } catch (e) {
        el.innerHTML = '<div style="padding:1rem;color:#94a3b8;font-style:italic;font-size:0.85rem;">Diagram could not be rendered</div>';
        el.classList.add('render-error');
      }
    }
    setTimeout(() => window.print(), 300);
  </script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

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
            onClick={handleExportPdf}
            className="flex w-full items-center gap-4 rounded-lg border border-zinc-700 bg-zinc-800 p-4 text-left transition-colors hover:border-indigo-500/50 hover:bg-zinc-800/80"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-900/30">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-zinc-100">Download as PDF</div>
              <div className="text-xs text-zinc-400">
                All documents with diagrams in a styled package — choose "Save as PDF" in the dialog
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
          {allDocs.length} document{allDocs.length !== 1 ? "s" : ""} will be exported
        </p>
      </div>
    </div>
  );
}

/** Simple markdown-to-HTML converter for the print page */
function markdownToHtml(md: string): string {
  // Extract code blocks FIRST (before HTML escaping corrupts them)
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

  // Now escape HTML in the remaining text
  html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Restore code blocks
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

  // Headers
  html = html.replace(/^#### (.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>");

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>");

  // Horizontal rules
  html = html.replace(/^---$/gm, "<hr>");

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Paragraphs — wrap standalone text lines
  html = html.replace(/^(?!<[a-z])((?!<\/|<h|<p|<ul|<ol|<li|<pre|<table|<block|<hr|<div).+)$/gm, "<p>$1</p>");

  return html;
}
