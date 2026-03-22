// ---------------------------------------------------------------------------
// BluePrintMe – Shared Type Definitions
// ---------------------------------------------------------------------------

// ---- Document classification ------------------------------------------------

/** Every document kind recognised by a blueprint. */
export type BlueprintDocType =
  | "prd"
  | "system-architecture"
  | "database-schema"
  | "api-spec"
  | "tech-stack"
  | "deployment"
  | "data-models"
  | "third-party-integrations"
  | "environment-config"
  | "executive-summary"
  | "decisions-log"
  | "changelog"
  | "readme";

/** How confident we are that the document content is current. */
export type ConfidenceLevel = "high" | "inferred" | "stale";

// ---- Core documents ---------------------------------------------------------

/** A single blueprint document (e.g. PRD, tech-stack, etc.). */
export interface BlueprintDocument {
  /** Human-readable display name, e.g. "Product Requirements". */
  name: string;
  /** File name on disk, e.g. "prd.md". */
  fileName: string;
  /** Semantic document type. */
  type: BlueprintDocType;
  /** Full markdown content. */
  content: string;
  /** ISO-8601 date of last modification. */
  lastModified: string;
  /** Confidence that the content is still accurate. */
  confidence: ConfidenceLevel;
  /** Top-level heading names, useful for navigation. */
  sections: string[];
}

/** A user-flow document stored in the flows/ subdirectory. */
export interface BlueprintFlow {
  /** Human-readable flow name. */
  name: string;
  /** File name on disk. */
  fileName: string;
  /** Full markdown content. */
  content: string;
  /** ISO-8601 date of last modification. */
  lastModified: string;
}

// ---- Metadata ---------------------------------------------------------------

/** Per-document status tracked inside `.blueprint-meta.json`. */
export interface DocumentStatus {
  complete: boolean;
  lastUpdated: string;
  /** Set when a document has not been refreshed within the staleness window. */
  staleSince?: string;
}

/** Project-level metadata persisted in `.blueprint-meta.json`. */
export interface BlueprintMeta {
  /** ISO-8601 date of the most recent sync. */
  lastSync: string;
  /** Display name of the project. */
  projectName: string;
  /** Overall readiness score (0 – 100). */
  readinessScore: number;
  /** Keyed by document type or file name. */
  documentStatus: Record<string, DocumentStatus>;
}

// ---- Blueprint aggregate ----------------------------------------------------

/** The full in-memory representation of a blueprint. */
export interface Blueprint {
  documents: BlueprintDocument[];
  flows: BlueprintFlow[];
  meta: BlueprintMeta;
}

// ---- Readiness scoring ------------------------------------------------------

/** Completion status of a single scored item. */
export type ReadinessStatus = "complete" | "partial" | "missing" | "stale";

/** One line-item inside a readiness breakdown. */
export interface ReadinessItem {
  docType: BlueprintDocType;
  label: string;
  status: ReadinessStatus;
  detail?: string;
}

/** Full readiness score with per-document breakdown. */
export interface ReadinessBreakdown {
  score: number;
  items: ReadinessItem[];
}

// ---- Executive summary ------------------------------------------------------

/** Target audience for generated executive summaries. */
export type SummaryPersona = "technical" | "non-technical" | "management";

// ---- API layer --------------------------------------------------------------

/** Shape returned by the blueprint API endpoint. */
export interface BlueprintApiResponse {
  documents: {
    name: string;
    path: string;
    content: string;
    lastModified: string;
  }[];
  flows: {
    name: string;
    path: string;
    content: string;
    lastModified: string;
  }[];
  meta: BlueprintMeta;
  readiness: ReadinessBreakdown;
}
