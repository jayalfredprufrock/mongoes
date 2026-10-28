---
'@jayalfredprufrock/mongoes': patch
---

fix: preserve sibling operator expressions (e.g. `{ $eq: 'x' }`) when expanding `$nin`/`$all` inside `$elemMatch`
