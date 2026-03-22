---
description: Force a full resync of all blueprint documents
allowed-tools: Bash(blueprintme:*), Read, Write, Edit, Glob, Grep
---

## Blueprint Full Resync

The user has requested a complete resynchronization of the `.blueprint/` folder. This means every document must be regenerated from the current codebase state.

### Steps

1. Read every existing `.blueprint/*.md` file to preserve manual annotations
2. Re-analyze the entire codebase (same process as `/blueprint`)
3. Regenerate all documents, merging in preserved annotations
4. Update `.blueprint/.blueprint-meta.json` with new sync timestamps
5. Report what changed and the updated Rebuild Readiness Score

### Important

- This is a FULL resync — do not skip any document type
- Preserve sections marked with `<!-- manual -->` comments
- Flag any conflicts between existing docs and current code
- Update the changelog with the resync event
