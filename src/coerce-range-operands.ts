import { dateMathPartsRegex, parseDateMath } from './parse-date-math';

export const isDateString = (value: unknown) =>
    typeof value === 'string' && value.indexOf('-') > 0 && !Number.isNaN(new Date(value).getTime());

export const tryCoerceDate = (value: unknown, isFilterOperand = false): string | number => {
    // leave numbers as is
    if (typeof value === 'number') return value;

    // dates can be immediately converted to timestamps
    if (value instanceof Date) return value.getTime();

    let coercedValue: number | string | undefined;

    if (typeof value === 'string') {
        if (isFilterOperand) {
            coercedValue = dateMathPartsRegex.test(value) ? parseDateMath(value) : value;
        } else if (isDateString(value)) {
            coercedValue = new Date(value).getTime();
        }
    }

    return coercedValue === undefined ? String(value) : coercedValue;
};

export const coerceRangeOperands = (fieldOperand: unknown, filterOperand: unknown): [string, string] | [number, number] => {
    const fieldOp = tryCoerceDate(fieldOperand);
    const filterOp = tryCoerceDate(filterOperand, true);

    if (typeof fieldOp === typeof filterOp) return [fieldOp, filterOp] as [string, string] | [number, number];

    if (typeof fieldOp === 'number') {
        if (isDateString(filterOp)) return [fieldOp, new Date(filterOp).getTime()];
        if (isNaN(Number(filterOp))) {
            throw Error(`Unable to coerce '${filterOp}' to a number.`);
        }
        return [fieldOp, Number(filterOp)];
    }

    return [fieldOp, String(filterOp)];
};
