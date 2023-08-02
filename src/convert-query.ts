/* eslint-disable @typescript-eslint/no-explicit-any */

const negatedOps: Record<string, string> = { $ne: '$eq', $nin: '$in' };
const boolOps: Record<string, string> = { $and: 'must', $or: 'should', $nor: 'must_not' };

type CustomOperation = (field: string, operand: unknown, options?: unknown) => any;

interface ConvertQueryConfig {
    operations?: Record<`$${string}`, CustomOperation>;
}

export const isOperator = (op: string): op is `$${string}` => {
    return op.startsWith('$');
};

export const convertQuery = (query: any, config?: ConvertQueryConfig, pathPrefix = '', inBool = false): any => {
    const esQuery: any = {};
    for (const key in query) {
        if (boolOps[key]) {
            query[key].forEach((q: any) => {
                addBoolQuery(esQuery, boolOps[key] as any, convertQuery(q, config, pathPrefix, true));
            });
        } else if (key === '$not') {
            addBoolQuery(esQuery, 'must_not', convertQuery(query.$not, config, pathPrefix, true));
        } else if (query[key] instanceof Object) {
            const { $options, ...operatorAndOperand } = query[key];
            const [operator = '', operand] = Object.entries(operatorAndOperand)[0] ?? [];
            const boolType = negatedOps[operator] ? 'must_not' : 'must';
            addBoolQuery(esQuery, boolType, convertExp(`${pathPrefix}${key}`, negatedOps[operator] ?? operator, operand, $options, config));
        } else if (key[0] !== '$') {
            addBoolQuery(esQuery, 'must', convertExp(`${pathPrefix}${key}`, '$eq', query[key], undefined, config));
        }
    }

    // small optimization to prevent redundant top level "must",
    // i.e. { bool: { must: { bool: {} } }}
    if (
        Object.keys(esQuery?.bool).length === 1 &&
        typeof esQuery?.bool?.must === 'object' &&
        !Array.isArray(esQuery?.bool?.must) &&
        (inBool || esQuery.bool.must.bool)
    ) {
        return esQuery.bool.must;
    }

    return esQuery;
};

export const addBoolQuery = (query: any, type: 'must' | 'should' | 'must_not', exp: unknown): any => {
    if (!query.bool) {
        query.bool = {};
    }
    if (query.bool[type]) {
        query.bool[type] = Array.isArray(query.bool[type]) ? [...query.bool[type], exp] : [query.bool[type], exp];
    } else {
        query.bool[type] = exp;
    }
};

export const convertExp = (field: string, operator: string, operand: unknown, options?: unknown, config?: ConvertQueryConfig): any => {
    if (!isOperator(operator)) {
        throw new Error('Operators must start with "$"');
    }

    switch (operator) {
        case '$eq': {
            return { term: { [field]: operand } };
        }

        case '$exists': {
            const exp = { exists: { field } };
            return operand ? exp : notExp(exp);
        }

        case '$in':
            return { terms: { [field]: operand } };

        case '$all': {
            return { terms_set: { [field]: { terms: operand, minimum_should_match_script: { source: 'params.num_terms' } } } };
        }

        case '$lt':
        case '$lte':
        case '$gt':
        case '$gte': {
            return { range: { [field]: { [operator.slice(1)]: operand } } };
        }

        case '$elemMatch': {
            return {
                nested: {
                    path: field,
                    query: convertQuery(operand, config, `${field}.`),
                },
            };
        }

        case '$regex': {
            const regex = operand instanceof RegExp ? operand : new RegExp(String(operand), options?.toString());
            const exp: Record<string, string | boolean> = { value: regex.source };
            if (regex.flags.includes('i')) {
                exp.case_insensitive = true;
            }
            return { regexp: { [field]: exp } };
        }

        default:
            const customOp = config?.operations?.[operator];
            if (typeof customOp === 'function') {
                return customOp(field, operand, options);
            }

            throw new Error('Unsupported operator');
    }
};

export const notExp = (exp: unknown): any => {
    return { bool: { must_not: exp } };
};
