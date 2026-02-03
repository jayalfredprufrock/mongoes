import {
    escapeAllRegex,
    negatedOperatorsMap,
    regexTokens,
    earthRadiusInMiles,
    CompoundOperator,
    compoundOperatorsMap,
    NegatedOperator,
    RegexToken,
} from './constants';
import { BasicOperator, basicOperators } from './operators';
import type { ConvertQueryConfig, Condition, Primitive, Location, LocationDistance } from './types';

export const isBasicOperator = (op: string): op is BasicOperator => Object.keys(basicOperators).includes(op);
export const isCompoundOperator = (op: string): op is CompoundOperator => Object.keys(compoundOperatorsMap).includes(op);
export const isNegatedOperator = (op: string): op is NegatedOperator => Object.keys(negatedOperatorsMap).includes(op);

export const isOperatorLike = (op: string): op is `$${string}` => op.startsWith('$');

export const isPrimitive = (val: unknown): val is Primitive => {
    return typeof val === 'string' || typeof val === 'boolean' || typeof val === 'number';
};

export const isLatLonTuple = (val: unknown): val is [number, number] => {
    return Array.isArray(val) && val.length === 2 && typeof val.at(0) === 'number' && typeof val.at(1) === 'number';
};

export const coercePrimitiveOperand = (fieldVal: Primitive, filterOperand: Primitive): Primitive => {
    if (typeof fieldVal === 'string') return String(filterOperand);
    if (typeof fieldVal === 'number') return Number(filterOperand);

    if (typeof filterOperand !== 'boolean') throw new Error('Unable to coerce filter operand. Expected boolean.');

    return filterOperand;
};

export const parseCondition = (obj: unknown, customOperators?: ConvertQueryConfig['operators']): Condition => {
    if (isPrimitive(obj)) {
        return { operator: '$eq', operand: obj, options: {} };
    }

    if (!obj || typeof obj !== 'object' || !Object.keys(obj).length) {
        throw new Error('Expected condition object.');
    }

    const operatorAndOptions = Object.keys(obj).filter(isOperatorLike);

    if (!operatorAndOptions.length) {
        if (!isPrimitive(obj)) {
            throw new Error('Expected primitive value for implicit $eq');
        }
    }

    if (Object.keys(obj).length !== operatorAndOptions.length) {
        throw new Error('Conditions require that the operator and any options begin with "$"');
    }

    const [operator, ...otherOperators] = operatorAndOptions.filter(
        op => customOperators?.[op] || isBasicOperator(op) || isNegatedOperator(op)
    );

    if (otherOperators.length) {
        throw new Error('Conditions can contain at most one operator.');
    }

    if (!operator) {
        throw new Error(`Unrecognized operator "${Object.keys(obj)}"`);
    }

    const { [operator as string]: operand, ...options } = obj as Record<string, any>;

    if (customOperators?.[operator]) {
        return { operator: customOperators[operator], operand, options };
    } else if (isNegatedOperator(operator)) {
        return { operator: negatedOperatorsMap[operator], operand, options, negated: true };
    } else if (isBasicOperator(operator)) {
        return { operator, operand, options };
    }

    throw new Error(`Unrecognized operator "${operator}"`);
};

export const locationToLatLonTuple = (location: Location): [number, number] => {
    const [lon, lat] = Array.isArray(location) ? location : isObj(location) ? [location.lon, location.lat] : [];

    if (typeof lon !== 'number' || typeof lat !== 'number') {
        throw new Error('Location must be specified as tuple [lon, lat] or a lon/lat object.');
    }

    return [lon, lat];
};

export const toRadians = (deg: number) => deg * (Math.PI / 180);

export const distanceToMiles = (distance: LocationDistance): number => {
    if (typeof distance === 'number') {
        return distance * earthRadiusInMiles;
    }

    const [match, distanceSansUnit = '', unit] =
        String(distance)
            .trim()
            .match(/^([\d.]+)\s*(mi|miles?|km|kilometers?)?$/i) ?? [];

    const dist = parseFloat(distanceSansUnit);
    if (!match || isNaN(dist)) throw new Error('Invalid distance.');

    return unit?.startsWith('mi') ? dist : dist * 0.621371;
};

export const escapeRegex = (text: string, allowedTokens: RegexToken[] = []): string => {
    const escape = allowedTokens.length
        ? RegExp('[' + regexTokens.filter(token => !allowedTokens.includes(token)).join('\\') + ']', 'g')
        : escapeAllRegex;

    return text.replace(escape, '\\$&');
};

export const isObj = (obj: unknown): obj is Record<string, any> => !!obj && typeof obj === 'object' && !Array.isArray(obj);

export const get = (obj: unknown, path: string): unknown | undefined => {
    if (!isObj(obj)) throw new Error('Expected object.');
    try {
        let objAtPathOrVal = obj;
        for (const segment of path.split('.')) {
            if (Array.isArray(objAtPathOrVal)) {
                objAtPathOrVal = objAtPathOrVal.flatMap(item => {
                    return item[segment] ?? [];
                });
                continue;
            }

            if (!isObj(objAtPathOrVal)) return;

            objAtPathOrVal = objAtPathOrVal[segment];
        }

        return objAtPathOrVal;
    } catch {
        return;
    }
};
