import sift from 'sift';
import { expandNestedArrayExps } from './expand-nested-array-exps';

describe('expandNestedArrayExps()', () => {
    const expandedSift = (query: any) => sift(expandNestedArrayExps(query));

    test('expands $in/$nin/$all within $elemMatch expressions', () => {
        const data = {
            responses: [
                { id: 'test', choice: 'A' },
                { id: 'test', choice: 'B' },
                { id: 'test', choice: 'C' },
                { id: 'bogus', choice: 'D' },
                { id: 'bogus', choice: 'E' },
                { id: 'bogus', choice: 'F' },
            ],
        };

        // one key is present in data
        expect(expandedSift({ responses: { $elemMatch: { id: 'test', choice: { $in: ['C', 'D'] } } } })(data)).toBe(true);
        expect(expandedSift({ responses: { $elemMatch: { id: 'test', choice: { $nin: ['C', 'D'] } } } })(data)).toBe(false);
        expect(expandedSift({ responses: { $elemMatch: { id: 'test', choice: { $all: ['C', 'D'] } } } })(data)).toBe(false);

        // all keys present in data
        expect(expandedSift({ responses: { $elemMatch: { id: 'test', choice: { $in: ['B', 'C'] } } } })(data)).toBe(true);
        expect(expandedSift({ responses: { $elemMatch: { id: 'test', choice: { $nin: ['B', 'C'] } } } })(data)).toBe(false);
        expect(expandedSift({ responses: { $elemMatch: { id: 'test', choice: { $all: ['B', 'C'] } } } })(data)).toBe(true);

        // keys and data match
        expect(expandedSift({ responses: { $elemMatch: { id: 'test', choice: { $in: ['A', 'B', 'C'] } } } })(data)).toBe(true);
        expect(expandedSift({ responses: { $elemMatch: { id: 'test', choice: { $nin: ['A', 'B', 'C'] } } } })(data)).toBe(false);
        expect(expandedSift({ responses: { $elemMatch: { id: 'test', choice: { $all: ['A', 'B', 'C'] } } } })(data)).toBe(true);

        // no keys present in data
        expect(expandedSift({ responses: { $elemMatch: { id: 'test', choice: { $in: ['D', 'E'] } } } })(data)).toBe(false);
        expect(expandedSift({ responses: { $elemMatch: { id: 'test', choice: { $nin: ['D', 'E'] } } } })(data)).toBe(true);
        expect(expandedSift({ responses: { $elemMatch: { id: 'test', choice: { $all: ['D', 'E'] } } } })(data)).toBe(false);
    });

    test('expands $in/$nin/$all within $elemMatch expressions using dot array syntax', () => {
        const data = {
            responses: [
                { id: 'test', response: [{ choice: 'A' }, { choice: 'B' }, { choice: 'C' }] },
                { id: 'bogus', response: [{ choice: 'D' }, { choice: 'E' }, { choice: 'F' }] },
            ],
        };

        // one key is present in data
        expect(expandedSift({ responses: { $elemMatch: { id: 'test', 'response.choice': { $in: ['C', 'D'] } } } })(data)).toBe(true);
        expect(expandedSift({ responses: { $elemMatch: { id: 'test', 'response.choice': { $nin: ['C', 'D'] } } } })(data)).toBe(false);
        expect(expandedSift({ responses: { $elemMatch: { id: 'test', 'response.choice': { $all: ['C', 'D'] } } } })(data)).toBe(false);

        // all keys present in data
        expect(expandedSift({ responses: { $elemMatch: { id: 'test', 'response.choice': { $in: ['B', 'C'] } } } })(data)).toBe(true);
        expect(expandedSift({ responses: { $elemMatch: { id: 'test', 'response.choice': { $nin: ['B', 'C'] } } } })(data)).toBe(false);
        expect(expandedSift({ responses: { $elemMatch: { id: 'test', 'response.choice': { $all: ['B', 'C'] } } } })(data)).toBe(true);

        // keys and data match
        expect(expandedSift({ responses: { $elemMatch: { id: 'test', 'response.choice': { $in: ['A', 'B', 'C'] } } } })(data)).toBe(true);
        expect(expandedSift({ responses: { $elemMatch: { id: 'test', 'response.choice': { $nin: ['A', 'B', 'C'] } } } })(data)).toBe(false);
        expect(expandedSift({ responses: { $elemMatch: { id: 'test', 'response.choice': { $all: ['A', 'B', 'C'] } } } })(data)).toBe(true);

        // no keys present in data
        expect(expandedSift({ responses: { $elemMatch: { id: 'test', 'response.choice': { $in: ['D', 'E'] } } } })(data)).toBe(false);
        expect(expandedSift({ responses: { $elemMatch: { id: 'test', 'response.choice': { $nin: ['D', 'E'] } } } })(data)).toBe(true);
        expect(expandedSift({ responses: { $elemMatch: { id: 'test', 'response.choice': { $all: ['D', 'E'] } } } })(data)).toBe(false);
    });

    test('expands $in/$nin/$all within nested $elemMatch expressions', () => {
        const data = {
            questions: [
                {
                    question: 'q',
                    responses: [
                        { id: 'test', choice: 'A' },
                        { id: 'test', choice: 'B' },
                        { id: 'test', choice: 'C' },
                        { id: 'bogus', choice: 'D' },
                        { id: 'bogus', choice: 'E' },
                        { id: 'bogus', choice: 'F' },
                    ],
                },
            ],
        };

        const makeQuery = (choiceExp: any) => ({
            questions: { $elemMatch: { question: 'q', responses: { $elemMatch: { id: 'test', choice: choiceExp } } } },
        });

        // one key is present in data
        expect(expandedSift(makeQuery({ $in: ['C', 'D'] }))(data)).toBe(true);
        expect(expandedSift(makeQuery({ $nin: ['C', 'D'] }))(data)).toBe(false);
        expect(expandedSift(makeQuery({ $all: ['C', 'D'] }))(data)).toBe(false);

        // all keys present in data
        expect(expandedSift(makeQuery({ $in: ['B', 'C'] }))(data)).toBe(true);
        expect(expandedSift(makeQuery({ $nin: ['B', 'C'] }))(data)).toBe(false);
        expect(expandedSift(makeQuery({ $all: ['B', 'C'] }))(data)).toBe(true);

        // keys and data match
        expect(expandedSift(makeQuery({ $in: ['A', 'B', 'C'] }))(data)).toBe(true);
        expect(expandedSift(makeQuery({ $nin: ['A', 'B', 'C'] }))(data)).toBe(false);
        expect(expandedSift(makeQuery({ $all: ['A', 'B', 'C'] }))(data)).toBe(true);

        // no keys present in data
        expect(expandedSift(makeQuery({ $in: ['D', 'E'] }))(data)).toBe(false);
        expect(expandedSift(makeQuery({ $nin: ['D', 'E'] }))(data)).toBe(true);
        expect(expandedSift(makeQuery({ $all: ['D', 'E'] }))(data)).toBe(false);
    });

    test('expands $in/$nin/$all within $elemMatch expressions inside compound expressions.', () => {
        const data = {
            responses: [
                { id: 'test', choice: 'A' },
                { id: 'test', choice: 'B' },
                { id: 'test', choice: 'C' },
                { id: 'bogus', choice: 'D' },
                { id: 'bogus', choice: 'E' },
                { id: 'bogus', choice: 'F' },
            ],
        };

        // within $and, one key is present in data
        expect(expandedSift({ $and: [{ responses: { $elemMatch: { id: 'test', choice: { $in: ['C', 'D'] } } } }] })(data)).toBe(true);
        expect(expandedSift({ $and: [{ responses: { $elemMatch: { id: 'test', choice: { $nin: ['C', 'D'] } } } }] })(data)).toBe(false);
        expect(expandedSift({ $and: [{ responses: { $elemMatch: { id: 'test', choice: { $all: ['C', 'D'] } } } }] })(data)).toBe(false);

        // within $or, one key is present in data
        expect(expandedSift({ $or: [{ responses: { $elemMatch: { id: 'test', choice: { $in: ['C', 'D'] } } } }] })(data)).toBe(true);
        expect(expandedSift({ $or: [{ responses: { $elemMatch: { id: 'test', choice: { $nin: ['C', 'D'] } } } }] })(data)).toBe(false);
        expect(expandedSift({ $or: [{ responses: { $elemMatch: { id: 'test', choice: { $all: ['C', 'D'] } } } }] })(data)).toBe(false);

        // within $nor, one key is present in data
        expect(expandedSift({ $nor: [{ responses: { $elemMatch: { id: 'test', choice: { $in: ['C', 'D'] } } } }] })(data)).toBe(false);
        expect(expandedSift({ $nor: [{ responses: { $elemMatch: { id: 'test', choice: { $nin: ['C', 'D'] } } } }] })(data)).toBe(true);
        expect(expandedSift({ $nor: [{ responses: { $elemMatch: { id: 'test', choice: { $all: ['C', 'D'] } } } }] })(data)).toBe(true);

        // within $not, one key is present in data
        expect(expandedSift({ $not: { responses: { $elemMatch: { id: 'test', choice: { $in: ['C', 'D'] } } } } })(data)).toBe(false);
        expect(expandedSift({ $not: { responses: { $elemMatch: { id: 'test', choice: { $nin: ['C', 'D'] } } } } })(data)).toBe(true);
        expect(expandedSift({ $not: { responses: { $elemMatch: { id: 'test', choice: { $all: ['C', 'D'] } } } } })(data)).toBe(true);
    });
});
