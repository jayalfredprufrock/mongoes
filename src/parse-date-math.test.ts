import { parseDateMath } from './parse-date-math';

describe('parseDateMath()', () => {
    const fixedNow = new Date('2024-02-15T12:34:56.789Z');

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(fixedNow);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test("parses 'now' as the current time", () => {
        const result = parseDateMath('now');
        expect(result).toBe(fixedNow.getTime());
    });

    test('adds days to now', () => {
        const result = parseDateMath('now+5d');
        expect(new Date(result).toISOString()).toBe('2024-02-20T12:34:56.789Z');
    });

    test('subtracts hours from now', () => {
        const result = parseDateMath('now-3h');
        expect(new Date(result).toISOString()).toBe('2024-02-15T09:34:56.789Z');
    });

    test('supports chained math expressions', () => {
        const result = parseDateMath('now+1d-2h+30m');
        expect(new Date(result).toISOString()).toBe('2024-02-16T11:04:56.789Z');
    });

    test('parses an absolute date with date math', () => {
        const result = parseDateMath('2024-01-10T00:00:00||+5d');
        expect(new Date(result).toISOString()).toBe('2024-01-15T00:00:00.000Z');
    });

    test('parses absolute date strings with an explicit timezone offset', () => {
        const result = parseDateMath('2024-01-10T00:00:00+02:00||+1d');

        // 2024-01-10T00:00:00+02:00 === 2024-01-09T22:00:00Z
        // +1 day => 2024-01-10T22:00:00Z
        expect(new Date(result).toISOString()).toBe('2024-01-10T22:00:00.000Z');
    });

    test('does not alter dates that already include Z', () => {
        const result = parseDateMath('2024-01-10T00:00:00Z||+1d');
        expect(new Date(result).toISOString()).toBe('2024-01-11T00:00:00.000Z');
    });

    test('adds seconds correctly', () => {
        const result = parseDateMath('now+1s');
        expect(new Date(result).toISOString()).toBe('2024-02-15T12:34:57.789Z');
    });

    test('adds minutes correctly', () => {
        const result = parseDateMath('now+90m');
        expect(new Date(result).toISOString()).toBe('2024-02-15T14:04:56.789Z');
    });

    test('adds weeks correctly', () => {
        const result = parseDateMath('now+2w');
        expect(new Date(result).toISOString()).toBe('2024-02-29T12:34:56.789Z');
    });

    test('handles end-of-month when adding months', () => {
        const result = parseDateMath('2023-01-31||+1M');
        expect(new Date(result).toISOString()).toBe('2023-02-28T00:00:00.000Z');
    });

    test('handles end-of-month when adding months (leap year boundary)', () => {
        const result = parseDateMath('2024-01-31||+1M');
        expect(new Date(result).toISOString()).toBe('2024-02-29T00:00:00.000Z');
    });

    test('handles month subtraction correctly', () => {
        const result = parseDateMath('2024-03-31||-1M');
        expect(new Date(result).toISOString()).toBe('2024-02-29T00:00:00.000Z');
    });

    test('adds years correctly', () => {
        const result = parseDateMath('2023-02-28||+1y');
        expect(new Date(result).toISOString()).toBe('2024-02-28T00:00:00.000Z');
    });

    test('handles leap day when adding years', () => {
        const result = parseDateMath('2024-02-29||+1y');
        expect(new Date(result).toISOString()).toBe('2025-02-28T00:00:00.000Z');
    });

    test('handles year subtraction across leap years', () => {
        const result = parseDateMath('2025-02-28||-1y');
        expect(new Date(result).toISOString()).toBe('2024-02-28T00:00:00.000Z');
    });

    // -------------------------
    // Rounding
    // -------------------------

    test('rounds down to second', () => {
        const result = parseDateMath('now/s');
        expect(new Date(result).toISOString()).toBe('2024-02-15T12:34:56.000Z');
    });

    test('rounds down to minute', () => {
        const result = parseDateMath('now/m');
        expect(new Date(result).toISOString()).toBe('2024-02-15T12:34:00.000Z');
    });

    test('rounds down to day', () => {
        const result = parseDateMath('now/d');
        expect(new Date(result).toISOString()).toBe('2024-02-15T00:00:00.000Z');
    });

    test('rounds down to month', () => {
        const result = parseDateMath('now/M');
        expect(new Date(result).toISOString()).toBe('2024-02-01T00:00:00.000Z');
    });

    test('rounds down to year', () => {
        const result = parseDateMath('now/y');
        expect(new Date(result).toISOString()).toBe('2024-01-01T00:00:00.000Z');
    });

    test('rounds down after date math', () => {
        const result = parseDateMath('now+10d/d');
        expect(new Date(result).toISOString()).toBe('2024-02-25T00:00:00.000Z');
    });

    test('rounds down to the beginning of the week (Sunday)', () => {
        const result = parseDateMath('2024-02-15||/w');
        expect(new Date(result).toISOString()).toBe('2024-02-11T00:00:00.000Z');
    });

    // -------------------------
    // Invalid input
    // -------------------------
    test('throws on invalid expressions', () => {
        expect(() => parseDateMath('now+5x')).toThrow();
        expect(() => parseDateMath('foo')).toThrow();
    });
});
