# MongoES

Meet the tiny and tasty TypeScript library for best-effort conversion of MongoDB search queries into equivalent ElasticSearch queries.
Supports most queries that make sense within the context of ES and also provides support for custom operations.

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
//                },
//            },
//        ],
//    },
// }
```

## Custom Operators

OOTB, mongoes includes a few operators that aren't a part of the MongoDB query specification:

-   `$like` - Maps to ES "wildcard" queries. Both `*` and `%` can be used to match zero or more characters,
    while `?` can be used to match exactly one character. Can pass "i" within options string to set case
    insensitive flag, however exactly how ElasticSearch treats case sensitivity is dependent on the underlying
    field mapping.
-   `$prefix` - Maps to ES "prefix" query. Can pass "i" within options string to set case insensitive flag.
-   `$ids` - Maps to ES "ids" query. The operand is an array of document \_ids. The field name is ignored.

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

## Gotchas

-   Assumes valid mongodb queries. No guarantees about what is returned/thrown for invalid mongodb queries.
-   Uses term queries for all text related operators. Might provide support for "match" queries if there is interest.
-   Not all operators translate cleanly to ES. The following operators are unsupported: `$where`, `$type`, `$size`, `$mod`
-   `$elemMatch` translates to a nested query
-   `$all` operator within `$elemMatch` is converted to must + multiple term expressions.
-   No guarantee about the syntactical stability of queries to allow future optimizations without a major version bump
-   Some attempt made to produce compact representations: e.g. removes redundant `{ bool: { must: { bool: exp }}}`
-   Queries involving regular expressions or wildcards (i.e. `$regex`, `$like`, `$prefix`, etc. ) should be used sparingly since
    they are significantly more expensive than simpler query operators.
-   Lucene's regex engine (mostly PCRE) is not fully compatible with JavaScript's. Of particular note:
    -   only support for `i` flag (case insensitive)
    -   no support for `^` and `$` (start/end anchors)
