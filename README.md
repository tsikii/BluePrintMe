# BluePrintMe

**Living Product IP for Claude Code** — Automatically maintains your PRD, system architecture, database schema, API specs, user flows, and more. Always in sync with your code. Enough to rebuild from scratch.

---

## What It Does

BluePrintMe is a Claude Code skill that keeps a `.blueprint/` folder in your project with a complete, always-current representation of your software. As you build with Claude Code, it tracks changes and updates your product documentation automatically.

The result: at any moment, the `.blueprint/` folder contains enough information for an AI to rebuild the entire product from scratch — in any language, framework, or architecture.

### What gets generated

| Document | Contents |
|---|---|
| `prd.md` | Product name, users, features, acceptance criteria, status |
| `system-architecture.md` | System diagram (Mermaid), component inventory, data flow |
| `database-schema.md` | ERD (Mermaid), table definitions, relationships, migrations |
| `api-spec.md` | Endpoints, auth, request/response formats, error handling |
| `flows/*.md` | Sequence diagrams for user journeys, state machines |
| `tech-stack.md` | Languages, frameworks, dependencies, build tools |
| `deployment.md` | Hosting, CI/CD, environments, infrastructure |
| `data-models.md` | Core entities, type definitions, validation rules |
| `third-party-integrations.md` | External services, SDKs, auth methods, fallbacks |
| `environment-config.md` | Env var names (never values), config locations, feature flags |
| `executive-summary.md` | Three views: Technical, Non-Technical, Top Management |
| `decisions-log.md` | ADRs, edge case catalog, trade-offs, deprecated approaches |
| `changelog.md` | Auto-maintained change log |

All diagrams use **Mermaid** syntax — they render natively in GitHub, VS Code, and the built-in web UI.

---

## Install

```bash
claude install-skill github:tsikii/BluePrintMe
```

That's it. The skill adds three slash commands and a post-commit hook to your Claude Code environment.

### Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI
- [Node.js](https://nodejs.org/) v18+ (for the review server)
- [tsx](https://github.com/privatenumber/tsx) — installed automatically via `npx`

---

## Usage

### Step 1: Generate your blueprint

Open Claude Code in any project and run:

```
/blueprint
```

Claude will scan your codebase — file structure, dependencies, routes, schemas, config — and generate the full `.blueprint/` folder. This takes a minute or two depending on project size.

### Step 2: Review in the web UI

```
/blueprint-review
```

This opens an interactive web UI in your browser where you can:

- Browse all blueprint documents via the sidebar
- View rendered Mermaid diagrams (architecture, ERD, flows) inline
- Check the **Rebuild Readiness Score** — a percentage showing how complete your blueprint is
- Export any document as markdown
- Send feedback back to Claude to fix or improve specific sections

### Step 3: Keep it in sync

From here, BluePrintMe stays current automatically:

- **After every `git commit`**, a hook flags the blueprint for resync
- Next time Claude is active, it picks up the flag and updates affected docs

If you've done major refactoring or want to force a full refresh:

```
/blueprint-sync
```

This regenerates every document from the current codebase state while preserving any manual annotations you've added (sections marked with `<!-- manual -->` are kept intact).

---

## How It Works

```
You write code with Claude Code
        |
        v
Post-commit hook fires
        |
        v
BluePrintMe flags affected docs
        |
        v
On next session or /blueprint-sync:
  - Re-analyzes changed code
  - Updates only affected documents
  - Preserves manual annotations
        |
        v
Review in web UI via /blueprint-review
```

### Two modes of operation

1. **Passive (hooks)** — After commits, BluePrintMe silently marks which docs need updating. The actual update happens on the next `/blueprint-sync` or `/blueprint` run.

2. **Active (slash commands)** — Run `/blueprint` to generate or update docs on demand, `/blueprint-review` to browse them in the web UI, or `/blueprint-sync` for a full resync.

---

## Slash Commands

| Command | What it does |
|---|---|
| `/blueprint` | Analyze the codebase and generate/update the `.blueprint/` folder |
| `/blueprint-review` | Open the web UI to browse, review, and annotate your blueprint |
| `/blueprint-sync` | Force a full resync of all blueprint documents |

---

## The Rebuild Readiness Score

BluePrintMe calculates a score based on:

- **Completeness** — Are all document types present with substantive content?
- **Freshness** — Were docs updated in the last 7 days?
- **Coverage** — Are all major code paths documented?

```
Rebuild Readiness: 87%

  PRD                  Complete
  System Architecture  Complete
  Database Schema      Complete
  API Spec             2 endpoints undocumented
  Flows                8/8 flows documented
  Tech Stack           Complete
  Deployment           Missing monitoring section
  Data Models          Complete
  Integrations         Complete
  Configuration        Complete
```

---

## Project Structure

```
BluePrintMe/
  .claude-plugin/
    plugin.json           # Skill manifest
  commands/
    blueprint.md          # /blueprint command
    blueprint-review.md   # /blueprint-review command
    blueprint-sync.md     # /blueprint-sync command
  hooks/
    hooks.json            # Post-commit hook definition
  server/
    index.ts              # Web UI server (Node/tsx)
  src/
    ui/                   # React web interface
  bin/
    blueprintme           # CLI entry point
  index.html              # React entry
  vite.config.ts          # Builds single-file HTML
  package.json
```

---

## License

MIT
