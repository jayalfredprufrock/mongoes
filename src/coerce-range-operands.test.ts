import { coerceRangeOperands } from './coerce-range-operands';

describe('coerceRangeOperands()', () => {
    describe('numeric field operand', () => {
        test('number field + number filter → number', () => {
            expect(coerceRangeOperands(10, 5)).toEqual([10, 5]);
        });

        test('number field + numeric string filter → number', () => {
            expect(coerceRangeOperands(10, '5')).toEqual([10, 5]);
        });

        test('number field + non-numeric string filter fails', () => {
            expect(() => coerceRangeOperands(10, 'abc')).toThrow();
        });
    });

    describe('date field operand', () => {
        test('Date field + Date filter → epoch millis', () => {
            const a = new Date('2020-01-01');
            const b = new Date('2021-01-01');

            expect(coerceRangeOperands(a, b)).toEqual([a.getTime(), b.getTime()]);
        });

        test('Date field + ISO string filter → epoch millis', () => {
            const field = new Date('2020-01-01');
            const filter = '2021-01-01';

            expect(coerceRangeOperands(field, filter)).toEqual([field.getTime(), new Date(filter).getTime()]);
        });

        test('Date field + numeric timestamp filter → epoch millis', () => {
            const field = new Date('2020-01-01');
            const ts = new Date('2021-01-01').getTime();

            expect(coerceRangeOperands(field, ts)).toEqual([field.getTime(), ts]);
        });

        test('Date field + non-date string filter fails', () => {
            expect(() => coerceRangeOperands(new Date(), 'not-a-date')).toThrow();
        });
    });

    describe('string field operand', () => {
        test('string field + string filter → string', () => {
            expect(coerceRangeOperands('apple', 'banana')).toEqual(['apple', 'banana']);
        });

        test('string field + number filter → string', () => {
            expect(coerceRangeOperands('10', 5)).toEqual(['10', '5']);
        });

        test('string field is not coerced to number even if numeric', () => {
            expect(coerceRangeOperands('10', '5')).toEqual(['10', '5']);
        });
    });

    describe('date math filter operand', () => {
        const fixedNow = new Date('2024-02-15T12:34:56.789Z');
        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(fixedNow);
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        test('with date field operand', () => {
            expect(coerceRangeOperands(fixedNow, 'now')).toEqual([fixedNow.getTime(), fixedNow.getTime()]);
        });

        test('with numeric date field operand', () => {
            expect(coerceRangeOperands(fixedNow.getTime(), 'now')).toEqual([fixedNow.getTime(), fixedNow.getTime()]);
        });

        test('with string date field operand', () => {
            expect(coerceRangeOperands(fixedNow.toISOString(), 'now')).toEqual([fixedNow.getTime(), fixedNow.getTime()]);
        });
    });

    describe('type precedence enforcement', () => {
        test('filter operand never forces numeric coercion', () => {
            expect(coerceRangeOperands('foo', 123)).toEqual(['foo', '123']);
        });

        test('filter operand never forces date coercion', () => {
            expect(coerceRangeOperands('foo', '2020-01-01')).toEqual(['foo', '2020-01-01']);
        });
    });
});
