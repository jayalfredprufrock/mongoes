---
'@jayalfredprufrock/mongoes': major
---

feat: official release

Breaking change:

Previously, $all expressions within $elemMatch were expanded to allow
the $all operator to match against the $elemMatch array values as a whole.
This functionality has been removed so that using sift directly and querying
elasticsearch yield the same results. The old behavior can be restored by wrapping
queries in the `expandNestedArrayExps()` utility.
