# MongoES

Meet the tasty and tiny TypeScript library for best-effort conversion of MongoDB search queries into equivalent ElasticSearch queries.
Supports most queries that make sense within the context of ES and also provides support for custom operations.

```sh
npm i mongoes
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

## Custom Operations

```ts
const operations = {
    $sw: (field: string, operand: unknown, options: unknown) => {
        const exp: any = { prefix: { [field]: { value: operand } } };
        if (String(options ?? '').includes('i')) {
            exp.prefix[field].case_insensitive = true;
        }
        return exp;
    },
};

const query = convertQuery({ name: { $sw: 'Man', $options: 'i' } }, { operations });

// query
// {
//    bool: {
//        must: {
//            prefix: {
//                name: {
//                    value: 'Man',
//                    case_insensitive: true
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
-   No guarantee about the stability of queries to allow future optimizations without a major version bump
-   Some attempt made to produce compact representations: e.g. removes redundant `{ bool: { must: { bool: exp }}}`
-   Lucerne's regex engine (mostly PCRE) is not fully compatible with JavaScript's. Of particular note:
    -   only support for `i` flag (case insensitive)
    -   no support for `^` and `$` (start/end anchors)
