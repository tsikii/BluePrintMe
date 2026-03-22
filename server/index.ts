#!/usr/bin/env node

import { createServer, IncomingMessage, ServerResponse } from "http";
import { readdir, readFile, stat, writeFile, unlink, access } from "fs/promises";
import { join, basename, dirname } from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BLUEPRINT_DIR = ".blueprint";
const META_FILE = ".blueprint-meta.json";
const NEEDS_SYNC_FILE = ".blueprint/.needs-sync";

// Path to the built single-file HTML (relative to server/)
const HTML_PATH = join(__dirname, "..", "dist", "index.html");

// Expected top-level blueprint documents for readiness scoring
const EXPECTED_DOCUMENTS = [
  "executive-summary.md",
  "prd.md",
  "decisions-log.md",
  "system-architecture.md",
  "data-models.md",
  "database-schema.md",
  "api-spec.md",
  "testing.md",
  "tech-stack.md",
  "deployment.md",
  "environment-config.md",
  "third-party-integrations.md",
  "licensing.md",
  "changelog.md",
  "README.md",
];

const DOC_LABELS: Record<string, string> = {
  "executive-summary.md": "Executive Summary",
  "prd.md": "PRD",
  "decisions-log.md": "Decisions Log",
  "system-architecture.md": "System Architecture",
  "data-models.md": "Data Models",
  "database-schema.md": "Database Schema",
  "api-spec.md": "API Spec",
  "testing.md": "Testing",
  "tech-stack.md": "Tech Stack",
  "deployment.md": "Deployment",
  "environment-config.md": "Configuration",
  "third-party-integrations.md": "Integrations",
  "licensing.md": "Licensing",
  "changelog.md": "Changelog",
  "README.md": "README",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Walk up from process.cwd() to find the nearest directory containing .blueprint/ */
function findProjectRoot(): string {
  let dir = process.cwd();
  while (true) {
    try {
      const bp = join(dir, BLUEPRINT_DIR);
      const s = require("fs").statSync(bp);
      if (s.isDirectory()) return dir;
    } catch {}
    const parent = dirname(dir);
    if (parent === dir) break; // reached filesystem root
    dir = parent;
  }
  return process.cwd(); // fallback
}

const cwd = findProjectRoot();

function setCors(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(res: ServerResponse, data: unknown, status = 200): void {
  setCors(res);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data, null, 2));
}

function sendHtml(res: ServerResponse, body: string): void {
  setCors(res);
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(body);
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

/** Recursively collect all .md files under a directory. */
async function collectMarkdownFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (entry.startsWith(".")) continue;
    const fullPath = join(dir, entry);
    const s = await stat(fullPath);
    if (s.isDirectory()) {
      const nested = await collectMarkdownFiles(fullPath);
      results.push(...nested);
    } else if (entry.endsWith(".md")) {
      results.push(fullPath);
    }
  }
  return results;
}

interface BlueprintDocument {
  name: string;
  path: string;
  content: string;
  lastModified: string;
}

async function loadBlueprintDocuments(): Promise<BlueprintDocument[]> {
  const blueprintPath = join(cwd, BLUEPRINT_DIR);
  const files = await collectMarkdownFiles(blueprintPath);
  const docs: BlueprintDocument[] = [];

  for (const filePath of files) {
    const content = await readFile(filePath, "utf-8");
    const fileStat = await stat(filePath);
    const relativePath = filePath.slice(cwd.length + 1);
    docs.push({
      name: basename(filePath, ".md"),
      path: relativePath,
      content,
      lastModified: fileStat.mtime.toISOString(),
    });
  }

  // Sort by priority order defined in EXPECTED_DOCUMENTS
  const priority = new Map(EXPECTED_DOCUMENTS.map((name, i) => [name, i]));
  docs.sort((a, b) => {
    const fileName = (d: BlueprintDocument) => d.path.split("/").pop() || "";
    const pa = priority.get(fileName(a)) ?? 999;
    const pb = priority.get(fileName(b)) ?? 999;
    return pa !== pb ? pa - pb : a.name.localeCompare(b.name);
  });
  return docs;
}

async function loadMeta(): Promise<Record<string, unknown>> {
  const metaPath = join(cwd, BLUEPRINT_DIR, META_FILE);
  try {
    const raw = await readFile(metaPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

interface ReadinessItem {
  docType: string;
  label: string;
  status: "complete" | "partial" | "missing" | "stale";
  detail?: string;
}

function computeReadiness(docs: BlueprintDocument[]): { score: number; items: ReadinessItem[] } {
  const docNames = new Set(docs.map((d) => d.name + ".md"));
  const items: ReadinessItem[] = [];
  let filled = 0;

  for (const expected of EXPECTED_DOCUMENTS) {
    const docType = expected.replace(/\.md$/, "");
    const label = DOC_LABELS[expected] || docType;

    if (docNames.has(expected)) {
      const doc = docs.find((d) => d.name + ".md" === expected);
      if (doc && doc.content.trim().length > 20) {
        const lastMod = new Date(doc.lastModified);
        const daysSince = (Date.now() - lastMod.getTime()) / 86400000;
        if (daysSince > 7) {
          items.push({ docType, label, status: "stale", detail: `Last updated ${Math.floor(daysSince)}d ago` });
        } else {
          items.push({ docType, label, status: "complete" });
          filled++;
        }
      } else {
        items.push({ docType, label, status: "partial", detail: "Document exists but has minimal content" });
      }
    } else {
      items.push({ docType, label, status: "missing" });
    }
  }

  return { score: Math.round((filled / EXPECTED_DOCUMENTS.length) * 100), items };
}

// ---------------------------------------------------------------------------
// Annotation formatting
// ---------------------------------------------------------------------------

interface AnnotationInput {
  type: string;
  sectionHeading: string;
  selectedText?: string;
  comment: string;
}

interface AnnotationPayloadInput {
  documentName: string;
  documentPath: string;
  annotations: AnnotationInput[];
  globalFeedback?: string;
}

function formatAnnotationsForClaude(payload: AnnotationPayloadInput): string {
  const lines: string[] = [];
  lines.push(`# Blueprint Review Feedback`);
  lines.push(`Document: ${payload.documentName} (${payload.documentPath})`);
  lines.push("");

  // Group annotations by section
  const grouped = new Map<string, AnnotationInput[]>();
  for (const a of payload.annotations) {
    const key = a.sectionHeading;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(a);
  }

  for (const [section, items] of grouped.entries()) {
    lines.push(`## Section: ${section}`);
    for (const a of items) {
      const tag = a.type.toUpperCase();
      lines.push(`- [${tag}] ${a.comment}`);
      if (a.selectedText) {
        lines.push(`  > Selected text: "${a.selectedText}"`);
      }
    }
    lines.push("");
  }

  if (payload.globalFeedback) {
    lines.push(`## General Feedback`);
    lines.push(payload.globalFeedback);
    lines.push("");
  }

  lines.push(`## Instructions`);
  lines.push(`1. Update the blueprint document at ${payload.documentPath} based on the feedback above. Address each annotation by section.`);
  lines.push(`2. For [NEEDS_UPDATE] annotations, revise the relevant section to reflect the current state of the code.`);
  lines.push(`3. For [DELETION] annotations, remove the indicated section or content.`);
  lines.push(`4. For [COMMENT] annotations, incorporate the feedback as appropriate.`);
  lines.push(`5. After making all changes, ask the user if they would like to run /blueprint-review again to verify the updates.`);

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Subcommand: review (default)
// ---------------------------------------------------------------------------

async function cmdReview(): Promise<void> {
  const blueprintPath = join(cwd, BLUEPRINT_DIR);
  if (!(await fileExists(blueprintPath))) {
    console.error(`No ${BLUEPRINT_DIR}/ directory found in ${cwd}. Run /blueprint first to initialize.`);
    process.exit(1);
  }

  const docs = await loadBlueprintDocuments();
  if (docs.length === 0) {
    console.error(`No markdown files found in ${BLUEPRINT_DIR}/. Run /blueprint first to generate documents.`);
    process.exit(1);
  }

  // Load the built HTML
  let htmlContent: string;
  try {
    htmlContent = await readFile(HTML_PATH, "utf-8");
  } catch {
    console.error(`Built HTML not found at ${HTML_PATH}. Run 'npm run build' first.`);
    process.exit(1);
  }

  console.error(`Found ${docs.length} blueprint document(s). Starting server...`);

  // Promise-based feedback gate
  let resolveFeedback!: (feedback: string) => void;
  const feedbackPromise = new Promise<string>((resolve) => {
    resolveFeedback = resolve;
  });

  const server = createServer(async (req, res) => {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    const { pathname } = url;

    // CORS preflight
    if (req.method === "OPTIONS") {
      setCors(res);
      res.writeHead(204);
      res.end();
      return;
    }

    // GET /api/blueprint — all documents
    if (req.method === "GET" && pathname === "/api/blueprint") {
      const documents = await loadBlueprintDocuments();
      const meta = await loadMeta();
      const readiness = computeReadiness(documents);

      const flows = documents.filter((d) => d.path.includes("/flows/"));
      const topDocs = documents.filter((d) => !d.path.includes("/flows/"));

      const documentStatus: Record<string, { complete: boolean; lastUpdated: string }> = {};
      for (const item of readiness.items) {
        documentStatus[item.docType] = {
          complete: item.status === "complete",
          lastUpdated: documents.find((d) => d.name + ".md" === item.docType + ".md")?.lastModified ?? "",
        };
      }

      sendJson(res, {
        documents: topDocs,
        flows,
        meta: {
          lastSync: meta.lastSync ?? new Date().toISOString(),
          projectName: meta.projectName ?? basename(cwd),
          readinessScore: readiness.score,
          documentStatus,
        },
        readiness,
      });
      return;
    }

    // GET /api/blueprint/:docName — single document
    if (req.method === "GET" && pathname.startsWith("/api/blueprint/")) {
      const docName = decodeURIComponent(pathname.slice("/api/blueprint/".length));
      const documents = await loadBlueprintDocuments();
      const doc = documents.find(
        (d) => d.name === docName || d.path.endsWith(docName) || d.path.endsWith(docName + ".md")
      );
      if (!doc) {
        sendJson(res, { error: `Document "${docName}" not found` }, 404);
        return;
      }
      sendJson(res, doc);
      return;
    }

    // POST /api/feedback — user submits feedback
    if (req.method === "POST" && pathname === "/api/feedback") {
      try {
        const body = JSON.parse(await readBody(req));

        // Support structured annotation payloads
        if (body.annotations && Array.isArray(body.annotations)) {
          const feedback = formatAnnotationsForClaude(body);
          resolveFeedback(feedback);
        } else {
          const feedback = body.feedback ?? "";
          resolveFeedback(feedback);
        }
        sendJson(res, { ok: true, message: "Feedback received. Server shutting down." });
      } catch {
        sendJson(res, { error: "Invalid JSON body" }, 400);
      }
      return;
    }

    // Serve the embedded HTML for everything else
    sendHtml(res, htmlContent);
  });

  // Listen on random port
  server.listen(0, () => {
    const addr = server.address();
    const port = typeof addr === "object" && addr ? addr.port : 0;
    const url = `http://localhost:${port}`;
    console.error(`BluePrintMe server running at ${url}`);

    // Open browser (macOS)
    exec(`open "${url}"`, (err) => {
      if (err) console.error(`Could not open browser automatically. Visit ${url} manually.`);
    });
  });

  // Wait for feedback from the UI
  console.error("Waiting for feedback from the review UI...");
  const feedback = await feedbackPromise;

  // Output the feedback to stdout (Claude Code reads this)
  console.log(feedback);

  // Shut down
  server.close();
  console.error("Server stopped. Exiting.");
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Subcommand: post-commit
// ---------------------------------------------------------------------------

async function cmdPostCommit(): Promise<void> {
  let input = "";
  try {
    input = await new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = [];
      process.stdin.on("data", (chunk: Buffer) => chunks.push(chunk));
      process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      process.stdin.on("error", reject);
      if (process.stdin.isTTY) resolve("");
    });
  } catch {
    process.exit(0);
  }

  if (!input.trim()) {
    process.exit(0);
  }

  let event: { tool_input?: { command?: string } };
  try {
    event = JSON.parse(input);
  } catch {
    process.exit(0);
  }

  const command = event?.tool_input?.command ?? "";
  if (!command.includes("git commit")) {
    process.exit(0);
  }

  const blueprintDir = join(cwd, BLUEPRINT_DIR);

  if (!(await fileExists(blueprintDir))) {
    process.exit(0);
  }

  // Output instruction to stdout — Claude Code reads this and acts on it
  console.log(`A commit was just made. Review the changes in this commit and update any affected .blueprint/ documents to keep them in sync with the code. Focus on files that changed in this commit — check git diff HEAD~1 to see what changed. Update only the blueprint documents that are affected by the changes. Remember to update .blueprint/licensing.md if any new dependencies or copied code were added.`);

  process.exit(0);
}

// ---------------------------------------------------------------------------
// Subcommand: sync-check
// ---------------------------------------------------------------------------

async function cmdSyncCheck(): Promise<void> {
  const markerPath = join(cwd, NEEDS_SYNC_FILE);

  if (await fileExists(markerPath)) {
    console.error("Blueprint sync recommended — run /blueprint-sync");
    try {
      await unlink(markerPath);
    } catch {
      // Best-effort removal
    }
  }

  process.exit(0);
}

// ---------------------------------------------------------------------------
// CLI dispatcher
// ---------------------------------------------------------------------------

const subcommand = process.argv[2] ?? "review";

switch (subcommand) {
  case "review":
    await cmdReview();
    break;
  case "post-commit":
    await cmdPostCommit();
    break;
  case "sync-check":
    await cmdSyncCheck();
    break;
  default:
    console.error(`Unknown subcommand: ${subcommand}`);
    console.error("Usage: blueprintme [review | post-commit | sync-check]");
    process.exit(1);
}
