import * as s from 'sift';
import type { OperationCreator } from 'sift/lib/core';
import { coerceRangeOperands } from './coerce-range-operands';
import { distanceToMiles, earthRadiusInMiles, locationToLatLonTuple, toRadians } from './util';

const regexTokens = ['-', '[', ']', '/', '{', '}', '(', ')', '*', '+', '?', '.', '\\', '^', '$', '|'] as const;
type RegexToken = (typeof regexTokens)[number];
const escapeAllRegex = RegExp('[' + regexTokens.join('\\') + ']', 'g');

export const escapeRegex = (text: string, allowedTokens: RegexToken[] = []): string => {
    const escape = allowedTokens.length
        ? RegExp('[' + regexTokens.filter(token => !allowedTokens.includes(token)).join('\\') + ']', 'g')
        : escapeAllRegex;

    return text.replace(escape, '\\$&');
};

// if string
// look for "now" or "||", if either is present, attempt parseDateMath()
// -- else, pass string to
export const siftCustomOperations: Record<string, OperationCreator<any>> = {
    $like(params, ownerQuery, options) {
        const caseInsensitive = ownerQuery.$options?.toString().includes('i');

        // convert "*" and "%" to ".*" while escaping any other regex tokens
        const exp = escapeRegex(String(params).trim().replaceAll('%', '*'), ['*', '?']).replaceAll('*', '.*').replaceAll('?', '.');
        const regex = new RegExp(exp, caseInsensitive ? 'si' : 's');

        return s.createEqualsOperation((value: unknown) => regex.test(String(value).trim()), ownerQuery, options);
    },
    $unlike(params, ownerQuery, options) {
        const caseInsensitive = ownerQuery.$options?.toString().includes('i');

        // convert "*" and "%" to ".*" while escaping any other regex tokens
        const exp = escapeRegex(String(params).trim().replaceAll('%', '*'), ['*', '?']).replaceAll('*', '.*').replaceAll('?', '.');
        const regex = new RegExp(exp, caseInsensitive ? 'si' : 's');

        return s.createEqualsOperation((value: unknown) => !regex.test(String(value).trim()), ownerQuery, options);
    },
    $includes(params, ownerQuery, options) {
        const caseInsensitive = ownerQuery.$options?.toString().includes('i');
        const exp = escapeRegex(String(params).trim());
        const regex = new RegExp(`.*${exp}.*`, caseInsensitive ? 'si' : 's');

        return s.createEqualsOperation((value: unknown) => regex.test(String(value).trim()), ownerQuery, options);
    },
    $excludes(params, ownerQuery, options) {
        const caseInsensitive = ownerQuery.$options?.toString().includes('i');
        const exp = escapeRegex(String(params).trim());
        const regex = new RegExp(`.*${exp}.*`, caseInsensitive ? 'si' : 's');

        return s.createEqualsOperation((value: unknown) => !regex.test(String(value).trim()), ownerQuery, options);
    },
    $prefix(params, ownerQuery, options) {
        const caseInsensitive = ownerQuery.$options?.toString().includes('i');
        let exp = String(params).trim();
        if (caseInsensitive) {
            exp = exp.toLowerCase();
        }
        return s.createEqualsOperation(
            (value: unknown) => {
                let val = String(value).trim();
                if (caseInsensitive) {
                    val = val.toLowerCase();
                }
                return val.startsWith(exp);
            },
            ownerQuery,
            options
        );
    },
    $ids(params, ownerQuery, options) {
        return s.createEqualsOperation(
            (value: unknown) => {
                const ids = [params].flat().map(String);
                return ids.includes(String(value));
            },
            ownerQuery,
            options
        );
    },
    $empty(params, ownerQuery, options) {
        return s.createEqualsOperation(
            (value: unknown) => {
                const isEmpty = value === undefined || (typeof value === 'string' && !value.trim());
                return params === isEmpty;
            },
            ownerQuery,
            options
        );
    },
    $nempty(params, ownerQuery, options) {
        return s.createEqualsOperation(
            (value: unknown) => {
                const isEmpty = value === undefined || (typeof value === 'string' && !value.trim());
                return params !== isEmpty;
            },
            ownerQuery,
            options
        );
    },
    $lt(params, ownerQuery, options) {
        return s.createEqualsOperation(
            (value: unknown) => {
                const [fieldOp, filterOp] = coerceRangeOperands(value, params);
                return fieldOp < filterOp;
            },
            ownerQuery,
            options
        );
    },
    $lte(params, ownerQuery, options) {
        return s.createEqualsOperation(
            (value: unknown) => {
                const [fieldOp, filterOp] = coerceRangeOperands(value, params);
                return fieldOp <= filterOp;
            },
            ownerQuery,
            options
        );
    },
    $gt(params, ownerQuery, options) {
        return s.createEqualsOperation(
            (value: unknown) => {
                const [fieldOp, filterOp] = coerceRangeOperands(value, params);
                return fieldOp > filterOp;
            },
            ownerQuery,
            options
        );
    },
    $gte(params, ownerQuery, options) {
        return s.createEqualsOperation(
            (value: unknown) => {
                const [fieldOp, filterOp] = coerceRangeOperands(value, params);
                return fieldOp >= filterOp;
            },
            ownerQuery,
            options
        );
    },

    $between(params, ownerQuery, options) {
        const { exclusive = false } = typeof ownerQuery?.$options === 'object' ? ownerQuery.$options : {};
        return s.createEqualsOperation(
            (value: unknown) => {
                const [fieldOp, filterOpMin] = coerceRangeOperands(value, params[0]);
                const [_, filterOpMax] = coerceRangeOperands(value, params[1]);

                if (exclusive === true) {
                    return fieldOp > filterOpMin && fieldOp < filterOpMax;
                } else if (exclusive === 'max') {
                    return fieldOp >= filterOpMin && fieldOp < filterOpMax;
                } else if (exclusive === 'min') {
                    return fieldOp > filterOpMin && fieldOp <= filterOpMax;
                } else {
                    return fieldOp >= filterOpMin && fieldOp <= filterOpMax;
                }
            },
            ownerQuery,
            options
        );
    },

    $near(params, ownerQuery, options) {
        const { maxDistance, distanceType } = typeof ownerQuery?.$options === 'object' ? ownerQuery.$options : {};

        const [filterLon, filterLat] = locationToLatLonTuple(params);
        const maxDistanceInMiles = distanceToMiles(maxDistance);

        return s.createEqualsOperation(
            (value: unknown) => {
                const [fieldLon, fieldLat] = locationToLatLonTuple(value);

                let distanceInMiles: number;

                const dx = toRadians(filterLon - fieldLon);
                const dy = toRadians(filterLat - fieldLat);

                if (distanceType === 'plane') {
                    const avgLat = toRadians((fieldLat + filterLat) / 2);
                    const x = dx * Math.cos(avgLat);
                    distanceInMiles = Math.sqrt(x ** 2 + dy ** 2) * earthRadiusInMiles;
                } else {
                    const a =
                        Math.sin(dy / 2) ** 2 + Math.cos(toRadians(fieldLat)) * Math.cos(toRadians(filterLat)) * Math.sin(dx / 2) ** 2;
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    distanceInMiles = earthRadiusInMiles * c;
                }

                return distanceInMiles <= maxDistanceInMiles;
            },
            ownerQuery,
            options
        );
    },
};

const originalSift = s.default;

export const sift: typeof originalSift = (query, options) => originalSift(query, { ...options, operations: siftCustomOperations });
