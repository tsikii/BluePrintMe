import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MermaidRenderer } from "./MermaidRenderer";
import { ExecutiveSummary } from "./ExecutiveSummary";
import { SectionAnnotationButton } from "./SectionAnnotationButton";
import { InlineCommentForm } from "./InlineCommentForm";
import { useAnnotations } from "./AnnotationContext";

interface Props {
  name: string;
  content: string;
  lastModified: string;
  docType?: string;
  documentPath?: string;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return dateStr;
  }
}

function getFreshness(dateStr: string): "fresh" | "stale" | "old" {
  try {
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffDays = diffMs / 86400000;
    if (diffDays < 1) return "fresh";
    if (diffDays < 7) return "stale";
    return "old";
  } catch {
    return "old";
  }
}

/** Extract plain text from React children (handles nested elements). */
function extractText(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(extractText).join("");
  if (React.isValidElement(children) && children.props?.children) {
    return extractText(children.props.children);
  }
  return "";
}

let mermaidBlockCounter = 0;
let headingCounter = 0;

export function DocumentViewer({ name, content, lastModified, docType, documentPath }: Props) {
  const freshness = getFreshness(lastModified);
  const freshnessColor = {
    fresh: "bg-green-500",
    stale: "bg-yellow-500",
    old: "bg-red-500",
  }[freshness];

  const freshnessLabel = {
    fresh: "Up to date",
    stale: "Recently updated",
    old: "May be outdated",
  }[freshness];

  // Reset counters on each render
  mermaidBlockCounter = 0;
  headingCounter = 0;

  const docPath = documentPath || "";

  // Use the ExecutiveSummary component for executive-summary docs
  const isExecutiveSummary =
    docType === "executive-summary" ||
    name.toLowerCase().includes("executive") ||
    name.toLowerCase().includes("summary");

  if (isExecutiveSummary) {
    return (
      <div className="mx-auto max-w-4xl px-8 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-zinc-100">{name}</h1>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              freshness === "fresh"
                ? "bg-green-900/30 text-green-400"
                : freshness === "stale"
                  ? "bg-yellow-900/30 text-yellow-400"
                  : "bg-red-900/30 text-red-400"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${freshnessColor}`} />
            {freshnessLabel}
          </span>
        </div>

        <p className="mb-6 text-xs text-zinc-500">
          Last modified: {formatDate(lastModified)}
        </p>

        <ExecutiveSummary content={content} lastModified={lastModified} />
      </div>
    );
  }

  /** Create a heading component with annotation support. */
  function makeHeading(Tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6") {
    return function AnnotatedHeading({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
      const idx = ++headingCounter;
      const text = extractText(children);

      return (
        <div className="group">
          <div className="flex items-center">
            <Tag {...props}>{children}</Tag>
            <SectionAnnotationButton heading={text} sectionIndex={idx} />
          </div>
          <ActiveCommentForm heading={text} sectionIndex={idx} documentPath={docPath} />
        </div>
      );
    };
  }

  return (
    <div className="mx-auto max-w-4xl px-8 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-zinc-100">{name}</h1>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            freshness === "fresh"
              ? "bg-green-900/30 text-green-400"
              : freshness === "stale"
                ? "bg-yellow-900/30 text-yellow-400"
                : "bg-red-900/30 text-red-400"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${freshnessColor}`} />
          {freshnessLabel}
        </span>
      </div>

      <p className="mb-6 text-xs text-zinc-500">
        Last modified: {formatDate(lastModified)}
      </p>

      {/* Markdown content */}
      <div className="blueprint-prose">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: makeHeading("h1"),
            h2: makeHeading("h2"),
            h3: makeHeading("h3"),
            h4: makeHeading("h4"),
            h5: makeHeading("h5"),
            h6: makeHeading("h6"),
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              const lang = match ? match[1] : "";
              const codeString = String(children).replace(/\n$/, "");

              // Render mermaid blocks as diagrams
              if (lang === "mermaid") {
                mermaidBlockCounter++;
                return (
                  <MermaidRenderer
                    code={codeString}
                    id={`doc-${mermaidBlockCounter}`}
                  />
                );
              }

              // Inline code vs code block
              const isInline = !className && !codeString.includes("\n");
              if (isInline) {
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }

              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
            pre({ children }) {
              return <pre>{children}</pre>;
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

/** Renders InlineCommentForm only when this section is active. */
function ActiveCommentForm({
  heading,
  sectionIndex,
  documentPath,
}: {
  heading: string;
  sectionIndex: number;
  documentPath: string;
}) {
  const { activeSection } = useAnnotations();
  if (activeSection !== heading) return null;
  return (
    <InlineCommentForm
      heading={heading}
      sectionIndex={sectionIndex}
      documentPath={documentPath}
    />
  );
}
