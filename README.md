# MongoES

Meet the tiny and tasty TypeScript library for best-effort conversion of MongoDB search queries into equivalent ElasticSearch queries.
Supports most queries that make sense within the context of ES and also provides support for custom operations. Zero dependencies.

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

## Built-in Operators

See [MongoDb docs](https://www.mongodb.com/docs/manual/reference/operator/query/) for a list of operators and options. Also check out the [sift.js](https://github.com/crcn/sift.js#readme) library, which provides support for evaluating/filtering in-memory objects using this same mongo-style syntax. A major motiviation for MongoES was to have a single filtering/querying syntax that could be used both against ES indexes and in-memory objects.

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

### Sift Filters

For those using this library alongside [sift.js](https://github.com/crcn/sift.js#readme), mongoes exports a set of custom sift.js operators providing support for the custom operators this library ships with.

To use, begin by making sure sift.js is installed:

```sh
npm i sift
```

Then either import and use the wrapped sift directly:

```ts
import { sift } from '@jayalfredprufrock/mongoes/sift';

const sifter = sift({ name: { $like: 'M?ngoes' } });

sifter({ name: 'Mangoes' }); // true
```

or use siftCustomOperations to construct your own:

```ts
import sift from 'sift';
import { siftCustomOperations } from '@jayalfredprufrock/mongoes/sift';

const sifter = sift({ name: { $like: 'M?ngoes' } }, { operations: siftCustomOperations });

sifter({ name: 'Mongoes' }); // true
```

## Notes

-   Assumes valid mongodb queries. No guarantees about what is returned/thrown for invalid mongodb queries. Please create an issue
    if there is specific invalid syntax that you think should be handled differently at runtime.
-   Uses term queries for all text related operators. Might provide support for "match" queries if there is interest.
-   Not all operators translate cleanly to ES. The following operators are unsupported: `$where`, `$type`, `$size`, `$mod`
-   `$elemMatch` translates to a nested query
-   `$or` queries always translate into `should` + `minimum_should_match=1`. This allows adjacent $and operators (including implicit)
    to work as expected.
-   `$all` operator within `$elemMatch` is converted to `must` + multiple `term` expressions.
-   No guarantee about the syntactical stability of queries to allow future optimizations without a major version bump
-   Some attempt made to produce compact representations: e.g. removes redundant `{ bool: { must: { bool: exp }}}`
-   Queries involving regular expressions or wildcards (i.e. `$regex`, `$like`, `$prefix`, etc. ) should be used sparingly since
    they are significantly more expensive than simpler query operators.
-   Lucene's regex engine (mostly PCRE) is not fully compatible with JavaScript's. Of particular note:
    -   only support for `i` flag (case insensitive)
    -   no support for `^` and `$` (start/end anchors)
