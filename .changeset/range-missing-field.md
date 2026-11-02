---
'@jayalfredprufrock/mongoes': patch
---

fix: `$gt`/`$gte`/`$lt`/`$lte`/`$between` never match a missing or null field in sift, matching OpenSearch range queries (previously the value was compared as the string "undefined")
