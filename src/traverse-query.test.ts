import { traverseQuery, TraverseQueryCbContext, TraverseQueryOptions } from './traverse-query';

const testTraverse = (query: any, options?: TraverseQueryOptions) => {
    const cbContexts: TraverseQueryCbContext[] = [];
    traverseQuery(query, context => cbContexts.push(context), options);
    return cbContexts;
};

describe('traverseQuery()', () => {
    describe('calls the callback with the correct values for', () => {
        test('empty query', () => {
            const results = testTraverse({});
            expect(results).toEqual([]);
        });

        test('implicit equality', () => {
            const query = { name: 'Ravel' };
            const results = testTraverse(query);
            expect(results).toEqual([{ field: 'name', $op: '$eq', value: 'Ravel', parent: query }]);
        });

        test('explicit equality', () => {
            const query = { name: { $eq: 'Ravel' } };
            const results = testTraverse(query);
            expect(results).toEqual([{ field: 'name', $op: '$eq', value: 'Ravel', parent: query }]);
        });

        test('array operators', () => {
            const query = { name: { $in: ['Ravel', 'Debussy'] } };
            const results = testTraverse(query);
            expect(results).toEqual([{ field: 'name', $op: '$in', value: ['Ravel', 'Debussy'], parent: query }]);
        });

        test('expressions with compound operators and traverseCompound=false', () => {
            const notQuery = { name: { $not: { $eq: 'Debussy' } } };
            const query = { $and: [{ name: 'Ravel' }, notQuery] };
            const results = testTraverse(query);
            expect(results).toEqual([
                { field: 'name', $op: '$eq', value: 'Ravel', parent: query.$and[0] },
                { field: 'name', $op: '$eq', value: 'Debussy', parent: notQuery.name.$not },
            ]);
        });

        test('expressions with compound operators and traverseCompound=true', () => {
            const notQuery = { name: { $not: { $eq: 'Debussy' } } };
            const query = { $and: [{ name: 'Ravel' }, notQuery] };
            const results = testTraverse(query, { traverseCompound: true });
            expect(results).toEqual([
                { field: '', $op: '$and', value: query.$and, parent: query },
                { field: 'name', $op: '$eq', value: 'Ravel', parent: query.$and[0] },
                { field: 'name', $op: '$not', value: { $eq: 'Debussy' }, parent: notQuery },
                { field: 'name', $op: '$eq', value: 'Debussy', parent: notQuery.name.$not },
            ]);
        });

        test('expressions with implicit $and traverseCompound=false', () => {
            const query = { name: 'Ravel', works: { $in: ['Bolero'] } };
            const results = testTraverse(query);
            expect(results).toEqual([
                { field: 'name', $op: '$eq', value: 'Ravel', parent: query },
                { field: 'works', $op: '$in', value: ['Bolero'], parent: query },
            ]);
        });

        test('expressions with implicit $and traverseCompound=true', () => {
            const query = { name: 'Ravel', works: { $in: ['Bolero'] } };
            const results = testTraverse(query, { traverseCompound: true });
            expect(results).toEqual([
                { field: 'name', $op: '$eq', value: 'Ravel', parent: query },
                { field: 'works', $op: '$in', value: ['Bolero'], parent: query },
            ]);
        });

        test('expressions with $elemMatch and traverseNested=false', () => {
            const query = { works: { $elemMatch: { key: 'C', bpm: { $eq: 120 } } } };
            const results = testTraverse(query);
            expect(results).toEqual([
                { field: 'works.key', $op: '$eq', value: 'C', parent: query.works.$elemMatch },
                { field: 'works.bpm', $op: '$eq', value: 120, parent: query.works.$elemMatch },
            ]);
        });

        test('expressions with $elemMatch and traverseNested=true', () => {
            const query = { works: { $elemMatch: { key: 'C', bpm: { $eq: 120 } } } };
            const results = testTraverse(query, { traverseNested: true });
            expect(results).toEqual([
                { field: 'works', $op: '$elemMatch', value: query.works.$elemMatch, parent: query },
                { field: 'works.key', $op: '$eq', value: 'C', parent: query.works.$elemMatch },
                { field: 'works.bpm', $op: '$eq', value: 120, parent: query.works.$elemMatch },
            ]);
        });

        test('expressions with nested $elemMatch and traverseNested=false', () => {
            const query = { works: { $elemMatch: { key: 'C', bpm: 130, editions: { $elemMatch: { published: { $gt: 1900 } } } } } };
            const results = testTraverse(query);
            expect(results).toEqual([
                { field: 'works.key', $op: '$eq', value: 'C', parent: query.works.$elemMatch },
                { field: 'works.bpm', $op: '$eq', value: 130, parent: query.works.$elemMatch },
                { field: 'works.editions.published', $op: '$gt', value: 1900, parent: query.works.$elemMatch.editions.$elemMatch },
            ]);
        });

        test('expressions with nested $elemMatch and traverseNested=true', () => {
            const query = { works: { $elemMatch: { key: 'C', bpm: 130, editions: { $elemMatch: { published: { $gt: 1900 } } } } } };
            const results = testTraverse(query, { traverseNested: true });
            expect(results).toEqual([
                { field: 'works', $op: '$elemMatch', value: query.works.$elemMatch, parent: query },
                { field: 'works.key', $op: '$eq', value: 'C', parent: query.works.$elemMatch },
                { field: 'works.bpm', $op: '$eq', value: 130, parent: query.works.$elemMatch },
                {
                    field: 'works.editions',
                    $op: '$elemMatch',
                    value: query.works.$elemMatch.editions.$elemMatch,
                    parent: query.works.$elemMatch,
                },
                { field: 'works.editions.published', $op: '$gt', value: 1900, parent: query.works.$elemMatch.editions.$elemMatch },
            ]);
        });

        test('kitchen sink', () => {
            const query = {
                works: { $elemMatch: { key: 'C', bpm: { $or: [{ $gt: 100 }, { $lt: 120 }] } } },
                $not: { year: { $lt: 1928 } },
            };
            const results = testTraverse(query);
            expect(results).toEqual([
                { field: 'works.key', $op: '$eq', value: 'C', parent: query.works.$elemMatch },
                { field: 'works.bpm', $op: '$gt', value: 100, parent: query.works.$elemMatch.bpm.$or[0] },
                { field: 'works.bpm', $op: '$lt', value: 120, parent: query.works.$elemMatch.bpm.$or[1] },
                { field: 'year', $op: '$lt', value: 1928, parent: query.$not },
            ]);
        });
    });
});
