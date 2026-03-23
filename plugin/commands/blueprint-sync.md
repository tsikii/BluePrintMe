---
description: Force a full resync of all blueprint documents
allowed-tools: Bash(blueprintme:*), Read, Write, Edit, Glob, Grep
---

## Blueprint Full Resync

The user has requested a complete resynchronization of the `.blueprint/` folder. This means every document must be regenerated from the current codebase state.

### Steps

1. **MANDATORY: Search for and read spec documents.** Use Glob to search for `*spec*`, `*requirement*`, `*brief*`, `*overview*`, `*PRD*` in the project root, and search `docs/`, `spec/`, `specs/` folders. Read EVERY match. These are the **authoritative source of truth** for what the product should do. The PRD blueprint MUST be based on these specs. All other blueprint documents must reference and align with spec content. If no spec is found, note this in the output.
2. Read every existing `.blueprint/*.md` file to preserve manual annotations
3. Re-analyze the entire codebase
4. Regenerate all documents — the spec content takes priority over code inferences. If the code doesn't match the spec, flag it as a gap in the relevant blueprint document.
5. Update `.blueprint/.blueprint-meta.json` with new sync timestamps
6. Report what changed, any spec-vs-code gaps found, and the updated Rebuild Readiness Score

### Important

- This is a FULL resync — do not skip any document type
- Preserve sections marked with `<!-- manual -->` comments
- Flag any conflicts between existing docs and current code
- Update the changelog with the resync event
