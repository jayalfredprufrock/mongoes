import { coerceRangeOperands } from './coerce-range-operands';
import { earthRadiusInMiles } from './constants';
import { Condition, Location, LocationDistance, MaybeArray, Primitive } from './types';
import {
    coercePrimitiveOperand,
    distanceToMiles,
    escapeRegex,
    get,
    isCompoundOperator,
    isLatLonTuple,
    isObj,
    locationToLatLonTuple,
    parseCondition,
    toRadians,
} from './util';

// NOTE: pay careful attention to the filterOperand and options types, as they
// are used to derive the allowed types for using the operator within a query.
// Do not include undefined as part of the fieldVal, however you still need to
// handle the undefined field value case accordingly. Similarly, it's possible
// for most field values to be empty arrays, so make sure that case is handled

const $eq = (fieldVal: MaybeArray<Primitive>, filterOperand: Primitive): boolean => {
    if (fieldVal === undefined) return false;
    return [fieldVal].flat().some(v => v === coercePrimitiveOperand(v, filterOperand));
};

const $exists = (fieldVal: MaybeArray<Primitive>, filterOperand: boolean): boolean => {
    return filterOperand === (fieldVal !== undefined && fieldVal !== null);
};

const $in = (fieldVal: MaybeArray<Primitive>, filterOperand: Primitive[]): boolean => {
    if (!filterOperand.length || fieldVal === undefined) return false;
    return [fieldVal].flat().some(v => filterOperand.map(o => coercePrimitiveOperand(v, o)).includes(v));
};

const $all = (fieldVal: MaybeArray<Primitive>, filterOperand: Primitive[]): boolean => {
    if (!filterOperand.length) return true;
    if (fieldVal === undefined) return false;
    return filterOperand.every(o => [fieldVal].flat().some(v => v === coercePrimitiveOperand(v, o)));
};

const $lt = (fieldVal: MaybeArray<string | number | Date>, filterOperand: string | number | Date): boolean => {
    if (fieldVal === undefined) return false;
    return [fieldVal].flat().some(v => {
        const [val, operand] = coerceRangeOperands(v, filterOperand);
        return val < operand;
    });
};

const $lte = (fieldVal: MaybeArray<string | number | Date>, filterOperand: string | number | Date): boolean => {
    if (fieldVal === undefined) return false;
    return [fieldVal].flat().some(v => {
        const [val, operand] = coerceRangeOperands(v, filterOperand);
        return val <= operand;
    });
};

const $gt = (fieldVal: MaybeArray<string | number | Date>, filterOperand: string | number | Date): boolean => {
    if (fieldVal === undefined) return false;
    return [fieldVal].flat().some(v => {
        const [val, operand] = coerceRangeOperands(v, filterOperand);
        return val > operand;
    });
};

const $gte = (fieldVal: MaybeArray<string | number | Date>, filterOperand: string | number | Date): boolean => {
    if (fieldVal === undefined) return false;
    return [fieldVal].flat().some(v => {
        const [val, operand] = coerceRangeOperands(v, filterOperand);
        return val >= operand;
    });
};

const $between = (
    fieldVal: MaybeArray<string | number | Date>,
    filterOperand: [string | number | Date, string | number | Date],
    options?: { $exclusive?: boolean | 'min' | 'max' }
): boolean => {
    if (fieldVal === undefined) return false;

    return [fieldVal].flat().some(v => {
        const [val, operandMin] = coerceRangeOperands(v, filterOperand[0]);
        const [_, operandMax] = coerceRangeOperands(v, filterOperand[1]);

        if (options?.$exclusive === true) {
            return val > operandMin && val < operandMax;
        } else if (options?.$exclusive === 'max') {
            return val >= operandMin && val < operandMax;
        } else if (options?.$exclusive === 'min') {
            return val > operandMin && val <= operandMax;
        } else {
            return val >= operandMin && val <= operandMax;
        }
    });
};

const $regex = (fieldVal: MaybeArray<string>, filterOperand: string | RegExp, options?: { $options?: 'i' }): boolean => {
    if (fieldVal === undefined) return false;
    const regex = new RegExp(filterOperand, options?.$options);
    return [fieldVal].flat().some(v => regex.test(v));
};

const $like = (fieldVal: MaybeArray<string>, filterOperand: string, options?: { $caseInsensitive?: boolean }): boolean => {
    if (fieldVal === undefined) return false;
    // convert "*" and "%" to ".*" while escaping any other regex tokens
    const exp = escapeRegex(filterOperand.trim().replaceAll('%', '*'), ['*', '?']).replaceAll('*', '.*').replaceAll('?', '.');
    const regex = new RegExp(exp, options?.$caseInsensitive ? 'si' : 's');
    return [fieldVal].flat().some(v => regex.test(v));
};

const $includes = (fieldVal: MaybeArray<string>, filterOperand: string, options?: { $caseInsensitive?: boolean }): boolean => {
    if (fieldVal === undefined) return false;
    const exp = escapeRegex(filterOperand.trim());
    const regex = new RegExp(`.*${exp}.*`, options?.$caseInsensitive ? 'si' : 's');
    return [fieldVal].flat().some(v => regex.test(v));
};

const $prefix = (fieldVal: MaybeArray<string>, filterOperand: string, options?: { $caseInsensitive?: boolean }): boolean => {
    if (fieldVal === undefined) return false;

    const fieldValues = [fieldVal].flat().map(v => v.trim());

    if (options?.$caseInsensitive) {
        return fieldValues.some(v => v.toLowerCase().startsWith(filterOperand.trim().toLowerCase()));
    }

    return fieldValues.some(v => v.startsWith(filterOperand.trim()));
};

const $empty = (fieldVal: MaybeArray<string>, filterOperand: boolean): boolean => {
    const val = [fieldVal].flat().filter(v => v !== undefined && !!v.trim());
    const isEmpty = !val.length;
    return filterOperand === isEmpty;
};

const $ids = (fieldVal: string, filterOperand: string[]): boolean => {
    if (fieldVal === undefined) return false;
    return filterOperand.includes(fieldVal);
};

const $near = (
    fieldVal: MaybeArray<Location>,
    filterOperand: Location,
    options: { $maxDistance: LocationDistance; $distanceType?: 'arc' | 'plane' }
): boolean => {
    if (fieldVal === undefined) return false;

    const [filterLon, filterLat] = locationToLatLonTuple(filterOperand);
    const maxDistanceInMiles = distanceToMiles(options.$maxDistance);

    const fieldValArray = Array.isArray(fieldVal) && !isLatLonTuple(fieldVal) ? fieldVal : [fieldVal];

    return fieldValArray.some(v => {
        const [fieldLon, fieldLat] = locationToLatLonTuple(v);

        let distanceInMiles: number;

        const dx = toRadians(filterLon - fieldLon);
        const dy = toRadians(filterLat - fieldLat);

        if (options?.$distanceType === 'plane') {
            const avgLat = toRadians((fieldLat + filterLat) / 2);
            const x = dx * Math.cos(avgLat);
            distanceInMiles = Math.sqrt(x ** 2 + dy ** 2) * earthRadiusInMiles;
        } else {
            const a = Math.sin(dy / 2) ** 2 + Math.cos(toRadians(fieldLat)) * Math.cos(toRadians(filterLat)) * Math.sin(dx / 2) ** 2;
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            distanceInMiles = earthRadiusInMiles * c;
        }

        return distanceInMiles <= maxDistanceInMiles;
    });
};

const $elemMatch = (fieldVal: any[], filterOperand: any): boolean => {
    if (!Array.isArray(fieldVal)) throw new Error('$elemMatch expects an array of objects as an operand.');
    return fieldVal.some(fieldValueObj => checkQuery(filterOperand, fieldValueObj));
};

export const basicOperators = {
    $eq,
    $exists,
    $in,
    $all,
    $lt,
    $lte,
    $gt,
    $gte,
    $between,
    $regex,
    $like,
    $includes,
    $prefix,
    $ids,
    $empty,
    $near,
    $elemMatch,
};

export type BasicOperators = typeof basicOperators;
export type BasicOperatorOperands = {
    [K in keyof BasicOperators]: Parameters<BasicOperators[K]>[1];
};
export type BasicOperatorOptions = {
    [K in keyof BasicOperators]: Parameters<BasicOperators[K]>[2];
};

export type BasicOperator = keyof BasicOperators;

export const checkCondition = (fieldValue: unknown, condition: Condition): boolean => {
    if (typeof condition.operator === 'function') {
        return false;
    }

    const result = (basicOperators[condition.operator] as any)(fieldValue, condition.operand, condition.options);

    return condition.negated ? !result : result;
};

export const checkQuery = (query: any, obj: any): boolean => {
    if (!isObj(query)) {
        throw new Error('Mongoes queries must be non-empty objects.');
    }

    for (const [fieldOrOperator, conditionOrOperand] of Object.entries(query)) {
        let passed: boolean | undefined;
        if (isCompoundOperator(fieldOrOperator)) {
            const queries = [conditionOrOperand].flat();
            switch (fieldOrOperator) {
                case '$and':
                    passed = queries.every(q => checkQuery(q, obj));
                    break;
                case '$or':
                    passed = queries.some(q => checkQuery(q, obj));
                    break;
                case '$nor':
                case '$not':
                    passed = !queries.some(q => checkQuery(q, obj));
                    break;
            }
        } else {
            const condition = parseCondition(conditionOrOperand);
            const fieldValue = get(obj, fieldOrOperator);
            passed = checkCondition(fieldValue, condition);
        }

        if (!passed) return false;
    }

    return true;
};
