/* eslint-disable @typescript-eslint/no-explicit-any */

const negatedOps: Record<string, string> = { $ne: '$eq', $nin: '$in' };
const boolOps: Record<string, string> = { $and: 'must', $or: 'should', $nor: 'must_not' };

type CustomOperator = (field: string, operand: any, options?: any) => any;

interface ConvertQueryConfig {
    operators?: Record<`$${string}`, CustomOperator>;
}

export const isOperator = (op: string): op is `$${string}` => {
    return op.startsWith('$');
};

export const convertQuery = (query: any, config?: ConvertQueryConfig, pathPrefix = '', inBool = false): any => {
    const expandedQuery = expandNestedAllExps(query);

    const esQuery: any = {};
    for (const key in expandedQuery) {
        if (boolOps[key]) {
            expandedQuery[key].forEach((q: any) => {
                addBoolQuery(esQuery, boolOps[key] as any, convertQuery(q, config, pathPrefix, true));
            });
        } else if (key === '$not') {
            addBoolQuery(esQuery, 'must_not', convertQuery(expandedQuery.$not, config, pathPrefix, true));
        } else if (expandedQuery[key] instanceof Object) {
            const { $options, ...operatorAndOperand } = expandedQuery[key];
            const [operator = '', operand] = Object.entries(operatorAndOperand)[0] ?? [];
            const boolType = negatedOps[operator] ? 'must_not' : 'must';
            addBoolQuery(esQuery, boolType, convertExp(`${pathPrefix}${key}`, negatedOps[operator] ?? operator, operand, $options, config));
        } else if (key[0] !== '$') {
            addBoolQuery(esQuery, 'must', convertExp(`${pathPrefix}${key}`, '$eq', expandedQuery[key], undefined, config));
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

/*
Hacky way to allow $all operator to work as expected
when used within $elemMatch queries. It looks for queries
of this form:

{ works: { $elemMatch: { bpm: 130, keys: { $all: ["C","C#"] } } } }

and converts them into an expanded form:

{
	$and: [
		{ works: { $elemMatch: { bpm: 130, keys: "C" } } },
		{ works: { $elemMatch: { bpm: 130, keys: "C#" } } }
	]
}
*/
export const expandNestedAllExps = (query: any): any => {
    const q: any = {};
    Object.entries<any>(query).forEach(([nestedKey, nestedExp]) => {
        if (nestedExp.$elemMatch) {
            const expandedExps: any[] = [];
            const nonExpandedExps: any = {};
            Object.entries<any>(nestedExp.$elemMatch).forEach(([field, exp]) => {
                if (exp && typeof exp === 'object' && Array.isArray(exp.$all)) {
                    expandedExps.push(...exp.$all.map((value: any) => ({ [field]: value })));
                } else {
                    nonExpandedExps[field] = exp;
                }
            });

            if (expandedExps.length) {
                if (!q.$and) {
                    q.$and = [];
                }
                expandedExps.forEach(exp => {
                    q.$and.push({
                        [nestedKey]: {
                            $elemMatch: { ...exp, ...nonExpandedExps },
                        },
                    });
                });
                return;
            }
        }
        q[nestedKey] = nestedExp;
    });

    return q;
};

export const convertExp = (field: string, operator: string, operand: any, options?: any, config?: ConvertQueryConfig): any => {
    if (!isOperator(operator)) {
        throw new Error('Operators must start with "$"');
    }

    const customOp = config?.operators?.[operator];
    if (typeof customOp === 'function') {
        return customOp(field, operand, options);
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

        case '$like': {
            const exp: Record<string, string | boolean> = { value: String(operand).replace(/%/g, '*') };
            if (options?.toString().includes('i')) {
                exp.case_insensitive = true;
            }
            return { wildcard: { [field]: exp } };
        }

        case '$prefix': {
            const exp: Record<string, string | boolean> = { value: String(operand) };
            if (options?.toString().includes('i')) {
                exp.case_insensitive = true;
            }
            return { prefix: { [field]: exp } };
        }

        case '$ids': {
            return { ids: { values: operand } };
        }
    }

    throw new Error('Unsupported operator');
};

export const notExp = (exp: unknown): any => {
    return { bool: { must_not: exp } };
};
