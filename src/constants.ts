import type { BasicOperator } from './operators';

export const earthRadiusInMiles = 3958.8;

export const negatedOperatorsMap = {
    $ne: '$eq',
    $nin: '$in',
    $unlike: '$like',
    $nempty: '$empty',
    $excludes: '$includes',
} as const satisfies Record<string, BasicOperator>;

export type NegatedOperators = typeof negatedOperatorsMap;
export type NegatedOperator = keyof NegatedOperators;

export const compoundOperatorsMap = {
    $and: 'must',
    $or: 'should',
    $nor: 'must_not',
    $not: 'must_not',
} as const;

export type CompoundOperator = keyof typeof compoundOperatorsMap;

export const regexTokens = ['-', '[', ']', '/', '{', '}', '(', ')', '*', '+', '?', '.', '\\', '^', '$', '|'] as const;
export const escapeAllRegex = RegExp('[' + regexTokens.join('\\') + ']', 'g');

export type RegexToken = (typeof regexTokens)[number];
