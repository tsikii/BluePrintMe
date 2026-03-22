# BluePrintMe — Product IP Skill for Claude Code

## Vision

BluePrintMe is a Claude Code skill that maintains a **living, always-current blueprint** of your software product. As you build with AI, BluePrintMe automatically keeps your product documentation — PRD, system architecture, database schema, user flows, API specs, and more — synchronized with the actual codebase.

**The core promise:** At any moment, your BluePrintMe folder contains an almost 100% accurate representation of the latest version of your software. This is enough information for an AI to rebuild the entire product from scratch — in any programming language, server architecture, or technology stack.

---

## Problem Statement

When building software with AI assistants, product knowledge becomes fragmented:
- The AI forgets context between sessions
- Architecture decisions live only in code and commit messages
- **Decisions and edge-case fine-tuning are lost** — the reasoning behind why a flow handles a specific edge case, why a validation rule exists, or why a particular approach was chosen over alternatives disappears once the conversation ends
- No single source of truth for "what does this product do and how"
- Onboarding a new AI session (or a new developer) requires extensive re-explanation
- Rebuilding or migrating the product requires archeological effort

---

## How It Works

### Automatic Documentation Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│                    Claude Code Session                   │
│                                                         │
│  User writes code ──► BluePrintMe hooks fire            │
│                        │                                │
│                        ▼                                │
│               Analyze changes against                   │
│               existing blueprint files                  │
│                        │                                │
│                        ▼                                │
│               Update affected docs:                     │
│               • PRD (features changed?)                 │
│               • System Diagram (new service?)           │
│               • DB Schema (migration?)                  │
│               • API Spec (new endpoint?)                │
│               • Flow Diagrams (new user path?)          │
│                        │                                │
│                        ▼                                │
│               Serve updated blueprint                   │
│               via web UI for review                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Two Modes of Operation

1. **Passive Mode (hooks):** After significant code changes (commit, plan exit, file writes), BluePrintMe silently analyzes what changed and updates the relevant blueprint documents. The user can review updates in the web UI.

2. **Active Mode (slash commands):** User explicitly triggers `/blueprint` to generate or regenerate documentation, `/blueprint-review` to open the web UI for review, or `/blueprint-sync` to force a full resync.

---

## Blueprint Folder Structure

```
.blueprint/
├── README.md                  # Index — what this project is, quick links
├── prd.md                     # Product Requirements Document
├── system-architecture.md     # System diagram (Mermaid/Graphviz)
├── database-schema.md         # Database structure + ERD
├── api-spec.md                # API endpoints, request/response formats
├── flows/                     # User and system flows
│   ├── authentication.md
│   ├── checkout.md
│   └── ...
├── tech-stack.md              # Languages, frameworks, dependencies
├── deployment.md              # Infrastructure, CI/CD, environments
├── data-models.md             # Core domain models and relationships
├── third-party-integrations.md # External services and APIs
├── environment-config.md      # Environment variables, secrets structure
├── executive-summary.md       # Auto-generated audience-tailored overview
├── decisions-log.md           # Architectural decisions & edge-case rationale
├── changelog.md               # Auto-maintained change log
└── .blueprint-meta.json       # Internal metadata (last sync, checksums)
```

### Document Specifications

#### `prd.md` — Product Requirements Document
- **Product name, tagline, and elevator pitch**
- **Target users and personas**
- **Core features** — each with description, acceptance criteria, current status
- **Non-functional requirements** — performance, security, scalability
- **Out of scope** — explicitly excluded features
- **Success metrics**

#### `system-architecture.md` — System Architecture
- **High-level system diagram** (Mermaid syntax for rendering)
- **Component inventory** — each service/module with purpose
- **Communication patterns** — sync/async, protocols, message formats
- **Data flow** — how data moves through the system
- **Key architectural decisions** — with rationale (ADR-lite)

#### `database-schema.md` — Database Schema
- **ERD** (Mermaid syntax)
- **Table/collection definitions** — columns, types, constraints, indexes
- **Relationships** — foreign keys, join tables
- **Migration history summary**
- **Seed data requirements**

#### `api-spec.md` — API Specification
- **Base URL and versioning strategy**
- **Authentication scheme**
- **Endpoints** — method, path, params, request/response body, status codes
- **Error format**
- **Rate limiting**

#### `flows/*.md` — Flow Diagrams
- **Sequence diagrams** (Mermaid syntax) for key user journeys
- **State machines** for complex stateful processes
- **Decision trees** for business logic

#### `tech-stack.md` — Technology Stack
- **Languages and versions**
- **Frameworks**
- **Package dependencies** (key ones, not exhaustive)
- **Build tools**
- **Testing frameworks**

#### `deployment.md` — Deployment & Infrastructure
- **Hosting platform**
- **CI/CD pipeline**
- **Environment tiers** (dev, staging, prod)
- **Infrastructure as code references**
- **Monitoring and alerting**

#### `data-models.md` — Domain Models
- **Core entities** with TypeScript/language-native type definitions
- **Value objects**
- **Enums and constants**
- **Validation rules**

#### `third-party-integrations.md` — External Services
- **Service name, purpose, and SDK/API used**
- **Authentication method**
- **Key endpoints consumed**
- **Fallback behavior**

#### `executive-summary.md` — Executive Summary
- **Three pre-built persona views:** Technical, Non-Technical, Top Management
- **Product overview** — what it does, who it's for, why it exists
- **Technical view** — architecture snapshot, tech stack, key design patterns, system boundaries
- **Non-technical view** — feature list in plain language, user journey summary, business rules explained simply
- **Management view** — product scope, strategic value, growth vectors, key metrics, competitive positioning
- Auto-regenerated from all other blueprint documents

#### `decisions-log.md` — Decisions & Edge Cases
- **Architectural Decision Records (ADRs)** — key choices with context, options considered, and rationale
- **Edge case catalog** — documented edge cases with the reasoning behind how they're handled
- **Trade-off log** — performance vs correctness, simplicity vs flexibility, and why each trade-off was made
- **Deprecated approaches** — what was tried and abandoned, and why (prevents future AI from re-trying failed approaches)

#### `environment-config.md` — Configuration
- **Required environment variables** (names only, never values)
- **Configuration file locations**
- **Feature flags**
- **Secrets management approach**

---

## Skill Architecture

### Plugin Structure (Claude Code Plugin)

```
blueprintme/
├── .claude-plugin/
│   └── plugin.json            # Plugin manifest
├── commands/
│   ├── blueprint.md           # /blueprint — generate/update docs
│   ├── blueprint-review.md    # /blueprint-review — open web UI
│   └── blueprint-sync.md      # /blueprint-sync — full resync
├── hooks/
│   └── hooks.json             # Hook definitions
├── server/
│   └── index.ts               # Bun server for web UI
├── packages/
│   ├── analyzer/              # Code analysis + diff detection
│   ├── generator/             # Document generation templates
│   ├── ui/                    # React web interface
│   └── shared/                # Shared types and utilities
├── index.html                 # Single-file web UI (built)
├── index.tsx                  # React entry point
├── vite.config.ts             # Build config
├── package.json
└── tsconfig.json
```

### Hook Integration

```json
{
  "hooks": [
    {
      "event": "PostToolUse",
      "matcher": {
        "tool_name": "Write|Edit"
      },
      "command": "blueprintme analyze-change --file \"$TOOL_INPUT_FILE_PATH\"",
      "timeout": 30000
    },
    {
      "event": "PermissionRequest",
      "matcher": {
        "tool_name": "ExitPlanMode"
      },
      "command": "blueprintme plan-complete",
      "timeout": 345600000
    },
    {
      "event": "PostToolUse",
      "matcher": {
        "tool_name": "Bash",
        "input_contains": "git commit"
      },
      "command": "blueprintme post-commit",
      "timeout": 60000
    }
  ]
}
```

### Slash Commands

#### `/blueprint` — Generate or Update Blueprint
```
Analyze the current codebase and generate/update the .blueprint/ folder.
Steps:
1. Run `blueprintme generate` to scan the codebase
2. Review generated docs in the web UI
3. Approve or annotate changes before saving
```

#### `/blueprint-review` — Review Blueprint in Web UI
```
Open the current blueprint in an interactive web UI.
Features:
- Navigate between all document types via sidebar
- View rendered Mermaid diagrams inline
- Annotate sections that need updating
- Compare current blueprint vs actual code state
- Export as PDF or share via URL
```

#### `/blueprint-sync` — Force Full Resync
```
Force a complete resynchronization of all blueprint documents.
Useful when:
- Major refactoring has occurred
- Blueprint is suspected to be out of date
- Importing a project for the first time
```

---

## Web UI Design

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│  BluePrintMe                              [Sync] [Export] [⚙]│
├──────────┬───────────────────────────────────────────────────┤
│          │                                                    │
│ 📋 PRD   │  ## Product Requirements Document                 │
│          │                                                    │
│ 🏗 System│  ### Product Overview                             │
│          │  MyApp is a task management platform...            │
│ 🗄 DB    │                                                    │
│          │  ### Core Features                                 │
│ 🔌 API   │  ┌─────────────────────────────────────┐          │
│          │  │ ✅ User Authentication               │          │
│ 🔄 Flows │  │ ✅ Task CRUD                         │          │
│          │  │ 🔨 Team Collaboration                │          │
│ ⚙ Tech   │  │ 📋 Notifications                    │          │
│          │  └─────────────────────────────────────┘          │
│ 🚀 Deploy│                                                    │
│          │  ### System Architecture                           │
│ 📦 Models│  ┌─────┐    ┌─────┐    ┌──────┐                  │
│          │  │ Web │───▶│ API │───▶│  DB  │                   │
│ 🔗 Integ.│  └─────┘    └─────┘    └──────┘                  │
│          │                                                    │
│ 🔐 Config│  ### Database Schema                              │
│          │  [Interactive ERD rendered from Mermaid]           │
│ 📝 Log   │                                                    │
│          │                                                    │
├──────────┴───────────────────────────────────────────────────┤
│ Last synced: 2 min ago │ 12 docs │ 3 pending updates        │
└──────────────────────────────────────────────────────────────┘
```

### Key UI Features

1. **Sidebar Navigation** — Quick access to all blueprint documents
2. **Mermaid Rendering** — System diagrams, ERDs, sequence diagrams rendered inline
3. **Freshness Indicators** — Visual cues showing which docs are current vs stale
4. **Inline Annotations** — Click any section to add notes or flag for update (plannotator-style)
5. **Diff View** — Compare blueprint state before/after changes
6. **Search** — Full-text search across all blueprint documents
7. **Export** — PDF, markdown bundle, or shareable URL
8. **AI Rebuild Readiness Score** — A percentage indicating how complete the blueprint is for an AI rebuild
9. **Executive Summary** — An auto-generated overview of the software tailored to different audiences. The user selects a persona:
   - **Technical** (new developer, CTO, architect) — focuses on architecture, tech stack, code structure, and system design decisions
   - **Non-Technical** (marketing manager, product manager, designer) — focuses on what the product does, user flows, features, and business logic in plain language
   - **Top Management** (CEO, CRO, board member) — focuses on product scope, strategic capabilities, competitive differentiators, and high-level metrics

### Tech Stack for Web UI

- **Framework:** React 18 + TypeScript
- **Styling:** Tailwind CSS
- **Diagram Rendering:** Mermaid.js (system diagrams, ERDs, sequence diagrams)
- **Markdown Rendering:** react-markdown with remark-gfm
- **Build:** Vite with vite-plugin-singlefile (single HTML output, like plannotator)
- **Server:** Bun HTTP server (serves UI, handles API calls)

---

## Document Generation Strategy

### Initial Generation (`/blueprint` on new project)

1. **Static Analysis**
   - Scan file tree for project structure
   - Parse package.json / requirements.txt / Cargo.toml for dependencies
   - Detect frameworks (Next.js, Express, Django, Rails, etc.)
   - Find database configurations (Prisma schema, migrations, models)
   - Locate API route definitions
   - Identify environment variable usage

2. **AI-Powered Analysis**
   - Claude reads key files and generates PRD from code behavior
   - Infers system architecture from imports and file organization
   - Generates Mermaid diagrams from code structure
   - Extracts API specs from route handlers
   - Builds flow diagrams from controller/handler logic

3. **User Review**
   - Generated docs open in web UI
   - User annotates, corrects, and approves
   - Approved docs are saved to `.blueprint/`

### Incremental Updates (hooks)

1. **Change Detection**
   - Hook fires after file write/edit
   - Diff analyzed to determine which blueprint docs are affected
   - Affected docs queued for update

2. **Smart Update**
   - Only regenerate affected sections
   - Preserve user annotations and manual edits
   - Track confidence level of auto-generated content

3. **Batching**
   - Don't update on every keystroke
   - Batch changes and update on commit or plan exit
   - Manual sync available via `/blueprint-sync`

---

## AI Rebuild Protocol

The ultimate test of BluePrintMe: can an AI rebuild the product from `.blueprint/` alone?

### The Rebuild Prompt

When an AI is given the `.blueprint/` folder, it should be able to:

1. **Understand** what the product does (from `prd.md`)
2. **Set up** the project (from `tech-stack.md`, `environment-config.md`)
3. **Build the data layer** (from `database-schema.md`, `data-models.md`)
4. **Implement the API** (from `api-spec.md`)
5. **Wire up integrations** (from `third-party-integrations.md`)
6. **Implement user flows** (from `flows/*.md`)
7. **Match the architecture** (from `system-architecture.md`)
8. **Deploy** (from `deployment.md`)

### Rebuild Readiness Score

BluePrintMe calculates a readiness score based on:
- Document completeness (all sections filled?)
- Document freshness (recently synced?)
- Cross-reference consistency (do docs agree with each other?)
- Coverage (are all major code paths documented?)

```
Rebuild Readiness: 87%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ██████████████████░░░

✅ PRD — Complete, synced 5 min ago
✅ System Architecture — Complete, synced 5 min ago
✅ Database Schema — Complete, synced 5 min ago
⚠️  API Spec — 2 endpoints undocumented
✅ Flows — 8/8 flows documented
✅ Tech Stack — Complete
⚠️  Deployment — Missing monitoring section
✅ Data Models — Complete
✅ Integrations — Complete
✅ Config — Complete
```

---

## Implementation Phases

### Phase 1 — Core Plugin & Document Generation
- Plugin manifest and slash commands
- `.blueprint/` folder structure creation
- Static analysis engine (file tree, dependencies, frameworks)
- AI-powered document generation for all document types
- Basic CLI output (no web UI yet)

### Phase 2 — Web UI
- Bun server serving single-file HTML
- Sidebar navigation across all document types
- Mermaid diagram rendering
- Markdown rendering with syntax highlighting
- Freshness indicators

### Phase 3 — Hook Integration & Auto-Sync
- PostToolUse hooks for file changes
- Change detection and affected-doc mapping
- Incremental document updates
- Commit-triggered sync
- Plan-exit-triggered sync

### Phase 4 — Advanced Features
- Inline annotations (plannotator-style)
- Diff view (before/after)
- Rebuild readiness score
- Export (PDF, URL sharing)
- Full-text search
- AI rebuild validation (test rebuild from blueprint)

---

## Key Design Decisions

### Why Markdown Files (not a database)?
- Version-controllable with git
- Human-readable without tools
- AI-readable for rebuild scenarios
- Easy to edit manually if needed
- Compatible with existing documentation workflows

### Why Mermaid for Diagrams?
- Text-based (fits in markdown files)
- Renders in GitHub, VS Code, and web browsers
- AI can generate and modify it
- No binary assets to manage
- Rich diagram types (flowchart, sequence, ERD, class, state)

### Why Single-File HTML (like Plannotator)?
- No install dependencies for the web UI
- Works offline
- Fast to serve from Bun
- Easy to cache and distribute
- Proven pattern (plannotator does this successfully)

### Why Hooks over MCP?
- Hooks enable passive, automatic updates
- No user intervention required for routine syncs
- MCP would require explicit tool calls
- Hooks integrate naturally with Claude Code's workflow
- Can still use slash commands for explicit actions

---

## Relationship to Plannotator

BluePrintMe is **inspired by** Plannotator but serves a different purpose:

| Aspect | Plannotator | BluePrintMe |
|--------|-------------|-------------|
| **Focus** | Plan review & annotation | Product documentation |
| **Timing** | Point-in-time (plan exit) | Continuous (always current) |
| **Content** | Implementation plans | Product IP (PRD, arch, DB, etc.) |
| **Interaction** | Approve/deny decisions | Browse, annotate, export |
| **Output** | Decision JSON back to Claude | Updated documentation files |
| **Lifecycle** | Single session | Project lifetime |

BluePrintMe borrows Plannotator's architectural patterns:
- Single-file HTML web UI
- Bun server backend
- Claude Code hook integration
- Inline annotation UX
- Vite + React + Tailwind stack
