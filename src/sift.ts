import originalSift, { createEqualsOperation } from 'sift';
import type { OperationCreator } from 'sift/lib/core';

const regexTokens = ['-', '[', ']', '/', '{', '}', '(', ')', '*', '+', '?', '.', '\\', '^', '$', '|'] as const;
type RegexToken = (typeof regexTokens)[number];
const escapeAllRegex = RegExp('[' + regexTokens.join('\\') + ']', 'g');

export const escapeRegex = (text: string, allowedTokens: RegexToken[] = []): string => {
    const escape = allowedTokens.length
        ? RegExp('[' + regexTokens.filter(token => !allowedTokens.includes(token)).join('\\') + ']', 'g')
        : escapeAllRegex;

    return text.replace(escape, '\\$&');
};

export const siftCustomOperations: Record<string, OperationCreator<any>> = {
    $like(params, ownerQuery, options) {
        const caseInsensitive = ownerQuery.$options?.toString().includes('i');

        // convert "*" and "%" to ".*" while escaping any other regex tokens
        const exp = escapeRegex(String(params).trim().replaceAll('%', '*'), ['*', '?']).replaceAll('*', '.*').replaceAll('?', '.');
        const regex = new RegExp(exp, caseInsensitive ? 'si' : 's');

        return createEqualsOperation((value: unknown) => regex.test(String(value).trim()), ownerQuery, options);
    },
    $unlike(params, ownerQuery, options) {
        const caseInsensitive = ownerQuery.$options?.toString().includes('i');

        // convert "*" and "%" to ".*" while escaping any other regex tokens
        const exp = escapeRegex(String(params).trim().replaceAll('%', '*'), ['*', '?']).replaceAll('*', '.*').replaceAll('?', '.');
        const regex = new RegExp(exp, caseInsensitive ? 'si' : 's');

        return createEqualsOperation((value: unknown) => !regex.test(String(value).trim()), ownerQuery, options);
    },
    $includes(params, ownerQuery, options) {
        const caseInsensitive = ownerQuery.$options?.toString().includes('i');
        const exp = escapeRegex(String(params).trim());
        const regex = new RegExp(`.*${exp}.*`, caseInsensitive ? 'si' : 's');

        return createEqualsOperation((value: unknown) => regex.test(String(value).trim()), ownerQuery, options);
    },
    $excludes(params, ownerQuery, options) {
        const caseInsensitive = ownerQuery.$options?.toString().includes('i');
        const exp = escapeRegex(String(params).trim());
        const regex = new RegExp(`.*${exp}.*`, caseInsensitive ? 'si' : 's');

        return createEqualsOperation((value: unknown) => !regex.test(String(value).trim()), ownerQuery, options);
    },
    $prefix(params, ownerQuery, options) {
        const caseInsensitive = ownerQuery.$options?.toString().includes('i');
        let exp = String(params).trim();
        if (caseInsensitive) {
            exp = exp.toLowerCase();
        }
        return createEqualsOperation(
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
        return createEqualsOperation(
            (value: unknown) => {
                const ids = [params].flat().map(String);
                return ids.includes(String(value));
            },
            ownerQuery,
            options
        );
    },
    $empty(params, ownerQuery, options) {
        return createEqualsOperation(
            (value: unknown) => {
                const isEmpty = value === undefined || (typeof value === 'string' && !value.trim());
                return params === isEmpty;
            },
            ownerQuery,
            options
        );
    },
    $nempty(params, ownerQuery, options) {
        return createEqualsOperation(
            (value: unknown) => {
                const isEmpty = value === undefined || (typeof value === 'string' && !value.trim());
                return params !== isEmpty;
            },
            ownerQuery,
            options
        );
    },
    $none(params, ownerQuery, options) {
        return createEqualsOperation(
            (value: unknown, key: string | number) => {
                if (typeof key === 'number') return false;

                const items = [params].flat();
                const arrayValue = [value].flat();

                return !arrayValue.some(val => items.includes(val));
            },
            ownerQuery,
            options
        );
    },
};

export const sift: typeof originalSift = (query, options) => originalSift(query, { ...options, operations: siftCustomOperations });
