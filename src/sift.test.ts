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

    describe('$includes custom operation', () => {
        test('Matches partial correctly, trimming whitespace.', () => {
            expect(sift({ name: { $includes: ' ve' } })({ name: 'Ravel ' })).toBe(true);
            expect(sift({ name: { $includes: ' ri' } })({ name: 'Ravel' })).toBe(false);
        });

        test('Matches entire phrase correctly, trimming whitespace.', () => {
            expect(sift({ name: { $includes: ' Ravel' } })({ name: 'Ravel ' })).toBe(true);
            expect(sift({ name: { $includes: 'Maurice' } })({ name: 'Ravel' })).toBe(false);
        });

        test('Case sensitive by default', () => {
            expect(sift({ name: { $includes: 'Ravel' } })({ name: 'ravel' })).toBe(false);
        });

        test('Supports case-insensitive option flag', () => {
            expect(sift({ name: { $includes: 'Rav', $options: '' } })({ name: 'ravel' })).toBe(false);
            expect(sift({ name: { $includes: 'Rav', $options: 'i' } })({ name: 'ravel' })).toBe(true);
        });
    });

    describe('$excludes custom operation', () => {
        test('Matches partial correctly, trimming whitespace.', () => {
            expect(sift({ name: { $excludes: ' ve' } })({ name: 'Ravel ' })).toBe(false);
            expect(sift({ name: { $excludes: ' ri' } })({ name: 'Ravel' })).toBe(true);
        });

        test('Matches entire phrase correctly, trimming whitespace.', () => {
            expect(sift({ name: { $excludes: ' Ravel' } })({ name: 'Ravel ' })).toBe(false);
            expect(sift({ name: { $excludes: 'Maurice' } })({ name: 'Ravel' })).toBe(true);
        });

        test('Case sensitive by default', () => {
            expect(sift({ name: { $excludes: 'Ravel' } })({ name: 'ravel' })).toBe(true);
        });

        test('Supports case-insensitive option flag', () => {
            expect(sift({ name: { $excludes: 'Rav', $options: '' } })({ name: 'ravel' })).toBe(true);
            expect(sift({ name: { $excludes: 'Rav', $options: 'i' } })({ name: 'ravel' })).toBe(false);
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

    describe('$between custom operation', () => {
        test('Matches correctly for numbers (inclusive by default)', () => {
            expect(sift({ value: { $between: [1, 5] } })({ value: 3 })).toBe(true);
            expect(sift({ value: { $between: [1, 5] } })({ value: 1 })).toBe(true);
            expect(sift({ value: { $between: [1, 5] } })({ value: 5 })).toBe(true);
            expect(sift({ value: { $between: [1, 5] } })({ value: 0 })).toBe(false);
            expect(sift({ value: { $between: [1, 5] } })({ value: 10 })).toBe(false);
        });

        test('Handles exclusive=true option', () => {
            expect(sift({ value: { $between: [1, 5], $options: { exclusive: true } } })({ value: 3 })).toBe(true);
            expect(sift({ value: { $between: [1, 5], $options: { exclusive: true } } })({ value: 1 })).toBe(false);
            expect(sift({ value: { $between: [1, 5], $options: { exclusive: true } } })({ value: 5 })).toBe(false);
        });

        test('Handles exclusive=min option', () => {
            expect(sift({ value: { $between: [1, 5], $options: { exclusive: 'min' } } })({ value: 3 })).toBe(true);
            expect(sift({ value: { $between: [1, 5], $options: { exclusive: 'min' } } })({ value: 1 })).toBe(false);
            expect(sift({ value: { $between: [1, 5], $options: { exclusive: 'min' } } })({ value: 5 })).toBe(true);
        });

        test('Handles exclusive=max option', () => {
            expect(sift({ value: { $between: [1, 5], $options: { exclusive: 'max' } } })({ value: 3 })).toBe(true);
            expect(sift({ value: { $between: [1, 5], $options: { exclusive: 'max' } } })({ value: 1 })).toBe(true);
            expect(sift({ value: { $between: [1, 5], $options: { exclusive: 'max' } } })({ value: 5 })).toBe(false);
        });

        test('Matches correctly for strings', () => {
            expect(sift({ value: { $between: ['bravo', 'delta'] } })({ value: 'charlie' })).toBe(true);
            expect(sift({ value: { $between: ['bravo', 'delta'] } })({ value: 'bravo' })).toBe(true);
            expect(sift({ value: { $between: ['bravo', 'delta'] } })({ value: 'delta' })).toBe(true);
            expect(sift({ value: { $between: ['bravo', 'delta'] } })({ value: 'alpha' })).toBe(false);
            expect(sift({ value: { $between: ['bravo', 'delta'] } })({ value: 'echo' })).toBe(false);
        });

        test('Matches correctly for dates', () => {
            const now = Date.now();
            expect(sift({ value: { $between: ['now-1m', 'now+1m'] } })({ value: now })).toBe(true);
            expect(sift({ value: { $between: ['now-1m', 'now+1m'] } })({ value: now - 1000 * 60 * 2 })).toBe(false);
            expect(sift({ value: { $between: ['now-1m', 'now+1m'] } })({ value: now + 1000 * 60 * 2 })).toBe(false);
        });
    });

    describe('overridden comparator operations ($gt, $gte, $lt, $lte)', () => {
        test('retains normal $lt behavior', () => {
            const sifter = sift({ value: { $lt: 0 } });
            expect(sifter({ value: -1 })).toBe(true);
            expect(sifter({ value: 0 })).toBe(false);
            expect(sifter({ value: 1 })).toBe(false);
        });

        test('retains normal $lte behavior', () => {
            const sifter = sift({ value: { $lte: 0 } });
            expect(sifter({ value: -1 })).toBe(true);
            expect(sifter({ value: 0 })).toBe(true);
            expect(sifter({ value: 1 })).toBe(false);
        });

        test('retains normal $gt behavior', () => {
            const sifter = sift({ value: { $gt: 0 } });
            expect(sifter({ value: 1 })).toBe(true);
            expect(sifter({ value: 0 })).toBe(false);
            expect(sifter({ value: -11 })).toBe(false);
        });

        test('retains normal $gte behavior', () => {
            const sifter = sift({ value: { $gte: 0 } });
            expect(sifter({ value: 1 })).toBe(true);
            expect(sifter({ value: 0 })).toBe(true);
            expect(sifter({ value: -11 })).toBe(false);
        });

        test('compares dates properly, including date math', () => {
            const now = new Date();
            expect(sift({ value: { $lt: now.getTime() } })({ value: now })).toBe(false);
            expect(sift({ value: { $lte: now.getTime() } })({ value: now })).toBe(true);
            expect(sift({ value: { $lt: 'now+1h' } })({ value: now.getTime() })).toBe(true);
            expect(sift({ value: { $gt: 'now+1h' } })({ value: now.getTime() })).toBe(false);
            expect(sift({ value: { $lt: 'now-1h' } })({ value: now })).toBe(false);
            expect(sift({ value: { $gt: 'now-1h' } })({ value: now })).toBe(true);
            expect(sift({ value: { $gt: '2025-12-30||/y' } })({ value: '2026-01-01' })).toBe(true);
        });
    });
});
