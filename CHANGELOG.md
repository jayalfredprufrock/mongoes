# @jayalfredprufrock/mongoes

## 1.1.0

### Minor Changes

-   4b7c60b: feat: support for range query date math and $between op

## 1.0.2

### Patch Changes

-   0f665d9: fix: allow sift utils to work in ESM context

## 1.0.1

### Patch Changes

-   aaf33a8: fix: expandNestedArrayExps should expand nested and compound expressions

## 1.0.0

### Major Changes

-   00e5a46: feat: official release

    Breaking change:

    Previously, $all expressions within $elemMatch were expanded to allow
    the $all operator to match against the $elemMatch array values as a whole.
    This functionality has been removed so that using sift directly and querying
    elasticsearch yield the same results. The old behavior can be restored by wrapping
    queries in the `expandNestedArrayExps()` utility.

## 0.8.0

### Minor Changes

-   3e05758: feat: new $none operator

## 0.7.1

### Patch Changes

-   8dd03f2: feat: new operators include and exclude

## 0.7.0

### Minor Changes

-   8be81d3: feat: add parent to traverseQuery context

## 0.6.0

### Minor Changes

-   df309ee: feat: new $unlike and $nempty custom operators

## 0.5.2

### Patch Changes

-   62bb8e3: specify exports for new util export

## 0.5.1

### Patch Changes

-   4f2e4a9: export utils separately

## 0.5.0

### Minor Changes

-   8cb3b4c: feat: improve traverseQuery, deprecate traverseMongoQuery

## 0.4.9

### Patch Changes

-   b99dd37: fix: dont switch to module just yet

## 0.4.8

### Patch Changes

-   98de7ab: upgrade deps

## 0.4.7

### Patch Changes

-   a419a32: use different plugin to export dts files

## 0.4.6

### Patch Changes

-   35fac20: fix: specify types before default per typescript recommendations

## 0.4.5

### Patch Changes

-   c572790: fix: publish types properly for sift extension

## 0.4.4

### Patch Changes

-   7074d17: fix: export sift entrypoint correctly

## 0.4.3

### Patch Changes

-   9ff3796: fix: export sift entry point properly

## 0.4.2

### Patch Changes

-   fbc06e5: feat: include configuration for custom operators in sift

## 0.4.1

### Patch Changes

-   c5d3d9a: fix: add minimum_should_match=1 to $or conditions

## 0.4.0

### Minor Changes

-   e742715: feat: add $empty operator

## 0.3.2

### Patch Changes

-   92ec5ef: feat: add traverseMongoQuery utility

## 0.3.1

### Patch Changes

-   f8a347d: fix: remove debug log

## 0.3.0

### Minor Changes

-   fe8e741: Breaking Change: remove $ilike custom operator in favor of $options "i" flag pattern

## 0.2.0

### Minor Changes

-   f55c28f: Breaking Change: custom operations option renamed to operators

## 0.1.1

### Patch Changes

-   c6853e8: Use regexp replace instead of replaceAll to extend compatibility

## 0.1.0

### Minor Changes

-   373a4f0: feat: new operators and support for nested $all

## 0.0.3

### Patch Changes

-   521bbe5: fix: compilation errors with noUncheckedIndexedAccess turned on

## 0.0.2

### Patch Changes

-   5416fbe: chore: update deps, fix readme typos
