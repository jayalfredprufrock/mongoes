export interface TraverseQueryOptions {
    traverseNested?: boolean;
    traverseCompound?: boolean;
}

export interface TraverseQueryCbContext {
    field: string;
    $op: string;
    value: any;
}

export const traverseQuery = (
    query: any,
    cb: (context: TraverseQueryCbContext) => void,
    options?: TraverseQueryOptions,
    fieldPrefix = ''
) => {
    const { traverseNested, traverseCompound } = options ?? {};
    if (!query || typeof query !== 'object') return;
    Object.entries(query).forEach(([key, value]) => {
        if (key.startsWith('$')) {
            const isCompound = ['$and', '$or', '$nor', '$not'].includes(key);
            const isNested = key === '$elemMatch';

            if ((traverseCompound && isCompound) || (traverseNested && isNested)) {
                cb({ field: fieldPrefix, $op: key, value });
            }

            if (key === '$not' || isNested) {
                const maybeDot = isNested ? '.' : '';
                traverseQuery(value, cb, options, `${fieldPrefix}${maybeDot}`);
            } else if (isCompound && Array.isArray(value)) {
                value.forEach(v => traverseQuery(v, cb, options, fieldPrefix));
            } else if (!isCompound && !isNested) {
                cb({ field: fieldPrefix, $op: key, value: query[key] });
            }
        } else {
            if (value && typeof value === 'object') {
                traverseQuery(value, cb, options, `${fieldPrefix}${key}`);
            } else {
                cb({ field: `${fieldPrefix}${key}`, $op: '$eq', value });
            }
        }
    });
};
