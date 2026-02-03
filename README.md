# MongoES

Meet the tiny and tasty TypeScript library for best-effort conversion of MongoDB search queries into equivalent ElasticSearch queries.
Supports most queries that make sense within the context of ES and also provides support for custom operations. A utility is also provided
to filter in-memory objects using the same syntax. Zero dependencies.

```sh
npm i @jayalfredprufrock/mongoes
```

## Usage

```ts
import { convertQuery } from 'mongoes';

const query = convertQuery({
    $and: [
        { type: 'fruit' },
        {
            $or: [{ name: 'mango' }, { name: 'el mango' }],
        },
    ],
});

// query
// {
//    bool: {
//        must: [
//            { term: { type: 'fruit' } },
//            {
//                bool: {
//                    should: [
//                          { term: { name: 'mango' } },
//                          { term: { name: 'el mango' } }
//                    ],
//                    minimum_should_match: 1
//                },
//            },
//        ],
//    },
// }
```

## 2.0 Release Breaking Changes

-   queries and options are strongly typed (use isMongoesQuery() type predicate for unknown objects)
-   introduced `makeFilter()` to replace reliance on siftjs for in-memory filtering
-   options are specified directly on operation objects (with `$` prefix), instead of nested under $options.

## Built-in Operators

-   mention caveat about $eq and arrays. (to avoid footguns, typings disallow arrays on $eq/$ne)

In general, consult the [MongoDb docs](https://www.mongodb.com/docs/manual/reference/operator/query/) for operator usage and options
or the [sift.js](https://github.com/crcn/sift.js#readme) library, which similarly provides support for evaluating/filtering in-memory
objects using mongo-style syntax. Note that unlike mongo and siftjs, this library does not support adjacent operators for a single field
(i.e. implicit $and). Instead use the $and operator to combine multiple conditions.

### Date Math

This library does its best to reasonably replicate elasticsearch behavior when working with date range queries, including
supporting date math expressions in the filter operand. Without explicit field mappings though, there are situations where
coercion rules cannot be reliably applied. Do not rely on having perfectly matched behavior unless you have explicitly tested
your specific expression requirements.

```ts
const filter = makeFilter({ createdAt: { $gt: 'now-1y/d' } });

filter({ createdAt: Date.now() }); //true
```

## Geospatial Queries ($near)

Basic support for `$near` queries is included, but not all mongodb options are available, specifically `$geometry` or `$minDistance`.
The operand can be lat/lon object when used with ES, but mongodb compatiblity requires operand be in legacy coordinates (`[lon, lat]` tuple).
Similarly, when used with mongodb, `$maxDistance` option must use numeric value in radians, while ES additionally allows for numeric strings
with distance units. The following units are supported: `miles/mi`, `meters/m`, `kilometers/km`. Finally, when used with ES, an additional
option `$distanceType` can be used to switch between "arc" (default) and "plane" (faster but less accurate) calculations. WKT string and geohash
operands are not supported. Sift support for this operator (along with its limitations) is also supported.

```ts
const query = convertQuery({ point: { $near: [25, -71], $maxDistance: 1 } });

// query (1 earth radian = 3959 miles)
// {
//    bool: {
//        must: { geo_distance: { location: [25, -71], distance: '3959mi' }
//    }
// }

const query = convertQuery({ point: { $near: { lon: 25, lat: -71 }, $maxDistance: '6378km', $distanceType: 'plane' } });

// query (1 earth radian = 6378km)
// {
//    bool: {
//        must: { geo_distance: { location: [25, -71], distance: '3959mi' }
//    }
// }
```

## Custom Operators

OOTB, mongoes includes a few operators that aren't a part of the MongoDB query specification:

-   `$like` (`$unlike`) - Maps to [ES Wildcard](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-wildcard-query.html)
    queries. Both `*` and `%` can be used to match zero or more characters, while `?` can be used to match exactly one character.
    Like the `$regex` operator, set `$options` to "i" to set the ES option `case_insensitive` to true. Note that exactly how
    ElasticSearch treats case sensitivity is also dependent on the underlying field mapping.
-   `$includes` (`$excludes`) - Shorthand for `{ $like: '*{search}*'}`. May eventually use a more optimized approach for text fields.
-   `$prefix` - Maps to [ES Prefix](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-prefix-query.html)
    queries. Similar to `$like`, supports passing "i" to `$options` for case insensitivity.
-   `$ids` - Maps to ES "ids" query. The operand is an array of document \_ids. The field name is not used when constructing the ES
    query, however it is used to specify a document-level id field for supporting Sift queries.
-   `$empty` (`$nempty`) - Works just like `$exists`, but does not consider empty strings (after trimming) to exist.
-   `$between` - Shorhand for combining `<` and `>`. The operand is a tuple, `[min, max]`. By default it is inclusive. Use `$options: { exclusive: true }`
    to perform an exclusive comparison. Pass `min` or `max` instead of `true` to control each operand individually.

Additionally, users can create their own custom operations by including an object of operator functions:

```ts
const operators = {
    $fuzz: (field: string, operand: string, options?: { fuzziness?: number | 'AUTO' }) => {
        return { fuzzy: { [field]: { value: operand, ...options } } };
    },
};

const query = convertQuery({ name: { $fuzz: 'Mangeos', $options: { fuzziness: 2 } } }, { operators });

// query
// {
//    bool: {
//        must: {
//            fuzzy: {
//                name: {
//                    value: 'Mangeos',
//                    fuzziness: 2
//                }
//            }
//        }
//    }
//}
```

## In-memory Filtering (makeFilter)

This library provides a utility `makeFilter()` that can be used to test objects against a query. Unless otherwise noted,
all operations/options are supported. A major motiviation for MongoES was to have a single filtering/querying syntax that
could be used against both ES indexes and in-memory objects. This does come with caveats, as elasticsearch often relies
on field mappings to perform coercion intelligently. This library aims to replicate ES behavior (as opposed to mongodb)
as closely as possible, however if strong guaranatees are required, particularly around coercion, arrays, and malformed
queries, test specific use cases accordingly. Please open an issue if you discover any inconsistencies.

// show example usage of makeFilter()

## Sift Library

Because [sift.js](https://github.com/crcn/sift.js#readme) also leverages mongodb style syntax, it can be used to perform
in-memory filtering on the same queries used to query elasticsearch. However, keep in mind that there are extra operators
supported by this library that are not supported by sift. Additionally, sift (and to some degree mongodb) supports using
adjacent operators on a single field (i.e. `{ age: { $gt: 25, $lt: 30 }} )`) as an implicit `$and` operation. This library
does not support this style syntax to allow for strongly typed operator options. Finally, ES does not have the concept
of array or null fields, leading to differences in behavior. As an example, sift will use the `$eq` operator to perform
deep equality on arrays, while this library will return true as long as the operand is present among any of the field's
indexed values (more like `$in`).

## Contributing

Pull requests (with accompanying tests!) are always welcome. If you wish to add official library support for a new operator,
make sure to align behavior with ES as closely as possible, documenting any limitations or inconsistencies. You must also
include makeFilter support (though it is OK to support a subset of options). If a particular operator comes with too many
caveats, either because it doesn't map cleanly to ES, or its impossible to add makeFilter support because we lack index
field mapping information at runtime, I may not be able to accept. Please ask first if you are unsure!

## Notes

-   Assumes valid mongodb queries. No guarantees about what is returned/thrown for invalid mongodb queries. Please create an issue
    if there is specific invalid syntax that you think should be handled differently at runtime.
-   adjacent operators on the same field (implicit and) are not supported, i.e. `{ createdAt: { $gt: '2012', $lt: '2020' } }`.
    Use an explicit `$and` instead.
-   Uses term queries for all text related operators. Might provide support for "match" queries if there is interest.
-   Not all operators translate cleanly to ES. The following operators are unsupported: `$where`, `$type`, `$size`, `$mod`
-   `$elemMatch` translates to a nested query
-   `$or` queries always translate into `should` + `minimum_should_match=1`. This allows adjacent $and operators (including implicit)
    to work as expected.
-   `$near` query does not support mongodb options.
-   No guarantee about the syntactical stability of queries to allow future optimizations without a major version bump
-   Some attempt made to produce compact representations: e.g. removes redundant `{ bool: { must: { bool: exp }}}`
-   Queries involving regular expressions or wildcards (i.e. `$regex`, `$like`, `$prefix`, etc. ) should be used sparingly since
    they are significantly more expensive than simpler query operators.
-   Lucene's regex engine (mostly PCRE) is not fully compatible with JavaScript's. Of particular note:
    -   only support for `i` flag (case insensitive)
    -   no support for `^` and `$` (start/end anchors)

strict mode, that validates query (but prevents using certain ES specific features)
