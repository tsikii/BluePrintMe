---
description: Force a full resync of all blueprint documents
allowed-tools: Bash(blueprintme:*), Read, Write, Edit, Glob, Grep
---

## Blueprint Full Resync

The user has requested a complete resynchronization of the `.blueprint/` folder. This means every document must be regenerated from the current codebase state.

### Steps

1. **Check for spec documents first.** Look for files like `spec.md`, `SPEC.md`, `specification.md`, `product-spec.md`, `requirements.md`, `PRD.md`, `brief.md`, `overview.md`, or any markdown file in a `docs/`, `spec/`, or `specs/` folder. If found, use them as the authoritative baseline — they take priority over inferences from code. Cross-reference spec with code and flag discrepancies.
2. Read every existing `.blueprint/*.md` file to preserve manual annotations
3. Re-analyze the entire codebase (same process as `/blueprint`)
4. Regenerate all documents, merging in preserved annotations
5. Update `.blueprint/.blueprint-meta.json` with new sync timestamps
6. Report what changed and the updated Rebuild Readiness Score

### Important

- This is a FULL resync — do not skip any document type
- Preserve sections marked with `<!-- manual -->` comments
- Flag any conflicts between existing docs and current code
- Update the changelog with the resync event
