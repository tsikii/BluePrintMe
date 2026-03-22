---
description: Generate or update the .blueprint/ product IP folder
allowed-tools: Bash(blueprintme:*), Read, Write, Edit, Glob, Grep
---

## Blueprint Generation

You are the BluePrintMe agent. Your job is to analyze the current codebase and generate/update a comprehensive `.blueprint/` folder that captures the complete product IP.

### What to generate

Scan the codebase and create/update the following files in `.blueprint/`:

1. **prd.md** — Product Requirements Document (product name, users, features, acceptance criteria, status)
2. **system-architecture.md** — System diagram in Mermaid, component inventory, communication patterns, data flow, key decisions
3. **database-schema.md** — ERD in Mermaid, table definitions, relationships, migration summary
4. **api-spec.md** — Endpoints, auth, request/response formats, error handling
5. **flows/** — Sequence diagrams for key user journeys, state machines, decision trees
6. **testing.md** — Test strategy, frameworks, test file locations, coverage areas, key test cases with descriptions, fixtures/factories, CI test commands, mocking patterns — detailed enough for an AI to recreate the full test suite
7. **tech-stack.md** — Languages, frameworks, dependencies, build tools, test frameworks
8. **deployment.md** — Hosting, CI/CD, environments, infra, monitoring
9. **data-models.md** — Core entities with type definitions, value objects, enums, validation
10. **third-party-integrations.md** — External services, SDKs, auth methods, fallback behavior
11. **environment-config.md** — Env var names (never values), config file locations, feature flags
12. **executive-summary.md** — Three views: Technical, Non-Technical, Top Management
13. **decisions-log.md** — ADRs, edge case catalog, trade-offs, deprecated approaches
14. **licensing.md** — All open-source dependencies with license type (MIT, Apache-2.0, GPL, etc.), source URL, and usage context. Any code copied or adapted from external sources must be listed with: original source URL, license, date copied, and which files use it
15. **changelog.md** — Change log with dates
16. **README.md** — Index with quick links to all documents

### How to analyze

1. Read the project's package.json / requirements.txt / Cargo.toml / go.mod etc.
2. Scan the file tree structure using Glob
3. Read key source files to understand architecture
4. Identify database schemas (Prisma, migrations, models, SQL files)
5. Find API route definitions
6. Detect frameworks and patterns
7. Search for environment variable usage
8. Find test files (*.test.*, *.spec.*, __tests__/, tests/) and document test strategy, frameworks, key test cases, and how to run them
9. Extract license information from package.json, lock files, LICENSE files, and dependency manifests — document every dependency's license type and source

### Rules

- Use Mermaid syntax for ALL diagrams (flowchart, sequenceDiagram, erDiagram, classDiagram, stateDiagram)
- Never include secret values, only variable names
- Be precise — document what EXISTS, not what might exist
- Mark confidence levels: `[HIGH]` for directly observed, `[INFERRED]` for deduced from patterns
- Preserve any existing manual edits in blueprint files (merge, don't overwrite)
- Create `.blueprint/.blueprint-meta.json` with sync timestamps
- **Licensing rule (ongoing):** Whenever you copy, adapt, or reference code from any external source (Stack Overflow, GitHub repos, blog posts, documentation, AI-generated snippets from other tools), you MUST add an entry to `.blueprint/licensing.md` with: the source URL, license type, date, and which project files use the copied code. This applies during blueprint generation AND during all regular coding work while BluePrintMe is installed

### After generation

Report a summary of what was created/updated and the Rebuild Readiness Score.
