/* eslint-disable @typescript-eslint/no-explicit-any */

import { compoundOperatorsMap } from './constants';
import { ConvertQueryConfig, Condition } from './types';
import { isCompoundOperator, isObj, parseCondition, locationToLatLonTuple } from './util';

export const convertQuery = (query: any, config?: ConvertQueryConfig, pathPrefix = '', inBool = false): any => {
    const esQuery: any = {};

    if (!isObj(query)) {
        throw new Error('Mongoes queries must be non-empty objects.');
    }

    for (const [fieldOrOperator, conditionOrOperand] of Object.entries(query)) {
        const fieldPath = `${pathPrefix}${fieldOrOperator}`;
        if (isCompoundOperator(fieldOrOperator)) {
            const queries = [conditionOrOperand].flat();
            for (const query of queries) {
                addBoolQuery(esQuery, compoundOperatorsMap[fieldOrOperator], convertQuery(query, config, pathPrefix, true));
            }
        } else {
            const condition = parseCondition(conditionOrOperand, config?.operators);
            addBoolQuery(esQuery, condition.negated ? 'must_not' : 'must', convertExp(`${fieldPath}`, condition));
        }
    }

    // small optimization to prevent redundant top level "must",
    // i.e. { bool: { must: { bool: {} } }}
    if (
        Object.keys(esQuery?.bool ?? {}).length === 1 &&
        typeof esQuery?.bool?.must === 'object' &&
        !Array.isArray(esQuery?.bool?.must) &&
        (inBool || esQuery.bool.must.bool)
    ) {
        return esQuery.bool.must;
    }

    return esQuery;
};

export const addBoolQuery = (query: any, type: 'must' | 'should' | 'must_not', exp: any): any => {
    if (!query.bool) {
        query.bool = {};
    }

    if (query.bool[type]) {
        query.bool[type] = Array.isArray(query.bool[type]) ? [...query.bool[type], exp] : [query.bool[type], exp];
    } else {
        query.bool[type] = exp;
    }

    if (type === 'should') {
        query.bool.minimum_should_match = 1;
    }
};

export const convertExp = (field: string, condition: Condition, config?: ConvertQueryConfig): any => {
    if (typeof condition.operator === 'function') {
        return condition.operator(field, condition.operand, condition.options);
    }

    switch (condition.operator) {
        case '$eq': {
            return { term: { [field]: condition.operand } };
        }

        case '$exists': {
            const exp = { exists: { field } };
            return condition.operand ? exp : notExp(exp);
        }

        case '$in':
            return { terms: { [field]: condition.operand } };

        case '$all': {
            return { terms_set: { [field]: { terms: condition.operand, minimum_should_match_script: { source: 'params.num_terms' } } } };
        }

        case '$lt':
        case '$lte':
        case '$gt':
        case '$gte': {
            return { range: { [field]: { [condition.operator.slice(1)]: condition.operand } } };
        }

        case '$between': {
            if (!Array.isArray(condition.operand) || condition.operand.length !== 2) {
                throw new Error('$between operator expects operand to be a numeric tuple of length two.');
            }

            const { $exclusive = false } = condition.options ?? {};

            const [min, max] = condition.operand;
            const minOp = $exclusive === true || $exclusive === 'min' ? 'gt' : 'gte';
            const maxOp = $exclusive === true || $exclusive === 'max' ? 'lt' : 'lte';

            return { range: { [field]: { [minOp]: min, [maxOp]: max } } };
        }

        case '$near': {
            const { $maxDistance, $distanceType } = condition.options ?? {};
            if (!$maxDistance) {
                throw new Error('$near operator requies a $maxDistance option.');
            }

            const [lon, lat] = locationToLatLonTuple(condition.operand);

            const distance = typeof $maxDistance === 'number' ? `${$maxDistance * 3959}mi` : $maxDistance;

            return { geo_distance: { [field]: [lon, lat], distance, distance_type: $distanceType } };
        }

        case '$regex': {
            const regex =
                condition.operand instanceof RegExp
                    ? condition.operand
                    : new RegExp(String(condition.operand), condition.options?.$options);

            const exp: Record<string, string | boolean> = { value: regex.source };
            if (regex.flags.includes('i')) {
                exp.case_insensitive = true;
            }
            return { regexp: { [field]: exp } };
        }

        case '$like': {
            const exp: Record<string, string | boolean> = { value: String(condition.operand).replace(/%/g, '*') };
            if (condition.options?.$caseInsensitive) {
                exp.case_insensitive = true;
            }
            return { wildcard: { [field]: exp } };
        }

        case '$includes': {
            const exp: Record<string, string | boolean> = { value: `*${String(condition.operand)}*` };
            if (condition.options?.$caseInsensitive) {
                exp.case_insensitive = true;
            }
            return { wildcard: { [field]: exp } };
        }

        case '$prefix': {
            const exp: Record<string, string | boolean> = { value: String(condition.operand) };
            if (condition.options?.$caseInsensitive) {
                exp.case_insensitive = true;
            }
            return { prefix: { [field]: exp } };
        }

        case '$ids': {
            return { ids: { values: condition.operand } };
        }

        case '$empty': {
            if (condition.operand) {
                return { bool: { should: [notExp({ exists: { field } }), { term: { [field]: '' } }] } };
            }
            return { bool: { must: [{ exists: { field } }, notExp({ term: { [field]: '' } })] } };
        }

        case '$elemMatch': {
            return {
                nested: {
                    path: field,
                    query: convertQuery(condition.operand, config, `${field}.`),
                },
            };
        }
    }
};

export const notExp = (exp: unknown): any => {
    return { bool: { must_not: exp } };
};
