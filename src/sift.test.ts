import { sift } from './sift';

describe('sift()', () => {
    describe('$like custom operation', () => {
        test('Matches correctly without wildcard tokens, trimming whitespace.', () => {
            expect(sift({ name: { $like: ' Ravel' } })({ name: 'Ravel ' })).toBe(true);
            expect(sift({ name: { $like: 'Maurice' } })({ name: 'Ravel' })).toBe(false);
        });

        test('Matches "?" as a single character', () => {
            expect(sift({ name: { $like: 'Ra?el' } })({ name: 'Ravel' })).toBe(true);
            expect(sift({ name: { $like: 'Ra?el' } })({ name: 'Ravvel' })).toBe(false);
        });

        test('Matches "*" as multiple characters', () => {
            expect(sift({ name: { $like: 'R*l' } })({ name: 'Ravel' })).toBe(true);
            expect(sift({ name: { $like: 'M* R*' } })({ name: 'Maurice Ravel' })).toBe(true);
            expect(sift({ name: { $like: 'M* R*' } })({ name: 'Claude Debussy' })).toBe(false);
        });

        test('Matches "%" as multiple characters', () => {
            expect(sift({ name: { $like: 'R%l' } })({ name: 'Ravel' })).toBe(true);
            expect(sift({ name: { $like: 'M% R%' } })({ name: 'Maurice Ravel' })).toBe(true);
            expect(sift({ name: { $like: 'M% R%' } })({ name: 'Claude Debussy' })).toBe(false);
        });

        test('Case sensitive by default', () => {
            expect(sift({ name: { $like: 'Ravel' } })({ name: 'ravel' })).toBe(false);
        });

        test('Supports case-insensitive option flag', () => {
            expect(sift({ name: { $like: 'Ravel', $options: '' } })({ name: 'ravel' })).toBe(false);
            expect(sift({ name: { $like: 'Ravel', $options: 'i' } })({ name: 'ravel' })).toBe(true);
        });
    });

    describe('$unlike custom operation', () => {
        test('Matches correctly without wildcard tokens, trimming whitespace.', () => {
            expect(sift({ name: { $unlike: ' Ravel' } })({ name: 'Ravel ' })).toBe(false);
            expect(sift({ name: { $unlike: 'Maurice' } })({ name: 'Ravel' })).toBe(true);
        });

        test('Matches "?" as a single character', () => {
            expect(sift({ name: { $unlike: 'Ra?el' } })({ name: 'Ravel' })).toBe(false);
            expect(sift({ name: { $unlike: 'Ra?el' } })({ name: 'Ravvel' })).toBe(true);
        });

        test('Matches "*" as multiple characters', () => {
            expect(sift({ name: { $unlike: 'R*l' } })({ name: 'Ravel' })).toBe(false);
            expect(sift({ name: { $unlike: 'M* R*' } })({ name: 'Maurice Ravel' })).toBe(false);
            expect(sift({ name: { $unlike: 'M* R*' } })({ name: 'Claude Debussy' })).toBe(true);
        });

        test('Matches "%" as multiple characters', () => {
            expect(sift({ name: { $unlike: 'R%l' } })({ name: 'Ravel' })).toBe(false);
            expect(sift({ name: { $unlike: 'M% R%' } })({ name: 'Maurice Ravel' })).toBe(false);
            expect(sift({ name: { $unlike: 'M% R%' } })({ name: 'Claude Debussy' })).toBe(true);
        });

        test('Case sensitive by default', () => {
            expect(sift({ name: { $unlike: 'Ravel' } })({ name: 'ravel' })).toBe(true);
        });

        test('Supports case-insensitive option flag', () => {
            expect(sift({ name: { $unlike: 'Ravel', $options: '' } })({ name: 'ravel' })).toBe(true);
            expect(sift({ name: { $unlike: 'Ravel', $options: 'i' } })({ name: 'ravel' })).toBe(false);
        });
    });

    describe('$prefix custom operation', () => {
        test('Matches correctly without, trimming whitespace.', () => {
            expect(sift({ name: { $prefix: 'Maurice' } })({ name: ' Maurice Ravel ' })).toBe(true);
            expect(sift({ name: { $prefix: 'Ravel' } })({ name: ' Maurice Ravel ' })).toBe(false);
        });

        test('Case sensitive by default', () => {
            expect(sift({ name: { $prefix: 'Rav' } })({ name: 'ravel' })).toBe(false);
        });

        test('Supports case-insensitive option flag', () => {
            expect(sift({ name: { $prefix: 'Rav', $options: '' } })({ name: 'ravel' })).toBe(false);
            expect(sift({ name: { $prefix: 'Rav', $options: 'i' } })({ name: 'ravel' })).toBe(true);
        });
    });

    describe('$ids custom operation', () => {
        test('Matches correctly', () => {
            expect(sift({ id: { $ids: [1, 2, 3] } })({ id: 1, name: ' Maurice Ravel ' })).toBe(true);
            expect(sift({ id: { $ids: [1, 2, 3] } })({ id: 5, name: ' Maurice Ravel ' })).toBe(false);
        });
    });

    describe('$empty custom operation', () => {
        test('Matches correctly when operands have a value', () => {
            expect(sift({ name: { $empty: true } })({ name: 'Maurice Ravel ' })).toBe(false);
            expect(sift({ name: { $empty: false } })({ name: 'Maurice Ravel ' })).toBe(true);
        });

        test('Matches correctly when values are missing', () => {
            expect(sift({ id: { $empty: true } })({ name: 'Maurice Ravel ' })).toBe(true);
            expect(sift({ id: { $empty: false } })({ name: 'Maurice Ravel ' })).toBe(false);
        });

        test('Matches correctly when values are empty strings (after trimming)', () => {
            expect(sift({ name: { $empty: true } })({ name: ' ' })).toBe(true);
            expect(sift({ name: { $empty: false } })({ name: ' ' })).toBe(false);
        });
    });

    describe('$nempty custom operation', () => {
        test('Matches correctly when operands have a value', () => {
            expect(sift({ name: { $nempty: true } })({ name: 'Maurice Ravel ' })).toBe(true);
            expect(sift({ name: { $nempty: false } })({ name: 'Maurice Ravel ' })).toBe(false);
        });

        test('Matches correctly when values are missing', () => {
            expect(sift({ id: { $nempty: true } })({ name: 'Maurice Ravel ' })).toBe(false);
            expect(sift({ id: { $nempty: false } })({ name: 'Maurice Ravel ' })).toBe(true);
        });

        test('Matches correctly when values are empty strings (after trimming)', () => {
            expect(sift({ name: { $nempty: true } })({ name: ' ' })).toBe(false);
            expect(sift({ name: { $nempty: false } })({ name: ' ' })).toBe(true);
        });
    });
});
