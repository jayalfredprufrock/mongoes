import { makeFilter } from './make-filter';

describe('makeFilter()', () => {
    describe('equality conditions', () => {
        test('$eq', () => {
            const filter = makeFilter({ composer: { $eq: 'Debussy' } });
            expect(filter({ composer: 'Debussy' })).toBe(true);
            expect(filter({ composer: 'Ravel' })).toBe(false);
            expect(filter({})).toBe(false);
        });

        test('implicit $eq', () => {
            const filter = makeFilter({ composer: 'Ravel' });
            expect(filter({ composer: 'Ravel' })).toBe(true);
            expect(filter({ composer: 'Debussy' })).toBe(false);
        });

        test('$eq when field value is array', () => {
            const filter = makeFilter({ composer: { $eq: 'Debussy' } });
            expect(filter({ composer: ['Debussy', 'Ravel'] })).toBe(true);
            expect(filter({ composer: ['Satie'] })).toBe(false);
            expect(filter({ composer: [] })).toBe(false);
        });

        test('$ne', () => {
            const filter = makeFilter({ composer: { $ne: 'Ravel' } });
            expect(filter({ composer: 'Debussy' })).toBe(true);
            expect(filter({ composer: 'Ravel' })).toBe(false);
        });

        test('$neq when field value is array', () => {
            const filter = makeFilter({ composer: { $ne: 'Debussy' } });
            expect(filter({ composer: ['Debussy', 'Ravel'] })).toBe(false);
            expect(filter({ composer: ['Satie'] })).toBe(true);
            expect(filter({ composer: [] })).toBe(true);
        });

        test('type coercion: string field, number operand', () => {
            const filter = makeFilter({ opus: { $eq: '23' } });
            expect(filter({ opus: 23 })).toBe(true);
            expect(filter({ opus: '23' })).toBe(true);
            expect(filter({ opus: 24 })).toBe(false);
        });

        test('type coercion: number field, string operand', () => {
            const filter = makeFilter({ opus: { $eq: 23 } });
            expect(filter({ opus: '23' })).toBe(true);
            expect(filter({ opus: 23 })).toBe(true);
            expect(filter({ opus: '24' })).toBe(false);
        });

        test('throws on number->boolean conversion attempt', () => {
            const filter = makeFilter({ published: { $eq: 1 } });
            expect(() => filter({ published: true })).toThrow();
            expect(() => filter({ published: false })).toThrow();
        });

        test('throws on string->boolean conversion attempt', () => {
            const filter = makeFilter({ published: { $eq: 'true' } });
            expect(() => filter({ published: true })).toThrow();
            expect(() => filter({ published: false })).toThrow();
        });
    });

    describe('$regex condition', () => {
        test('matches basic pattern', () => {
            const filter = makeFilter({ title: { $regex: /^Cl.*e$/ } });
            expect(filter({ title: 'La Mer' })).toBe(false);
            expect(filter({ title: 'Claude' })).toBe(true);
            expect(filter({ title: ['Claude', 'La Mer'] })).toBe(true);
            expect(filter({})).toBe(false);
        });

        test('matches string pattern', () => {
            const filter = makeFilter({ title: { $regex: 'Lune' } });
            expect(filter({ title: 'Clair de Lune' })).toBe(true);
            expect(filter({ title: 'La Mer' })).toBe(false);
        });

        test('respsects case insensitive flag options (i)', () => {
            const filter = makeFilter({ title: { $regex: 'lune', $options: 'i' } });
            expect(filter({ title: 'Clair de Lune' })).toBe(true);
            expect(filter({ title: 'La Mer' })).toBe(false);
        });
    });

    describe('$exists condition', () => {
        test('when true', () => {
            const filter = makeFilter({ opus: { $exists: true } });
            expect(filter({ opus: 23 })).toBe(true);
            expect(filter({})).toBe(false);
        });

        test('when false', () => {
            const filter = makeFilter({ opus: { $exists: false } });
            expect(filter({ opus: 23 })).toBe(false);
            expect(filter({})).toBe(true);
        });
    });

    describe('array conditions', () => {
        test('$in with non-array field', () => {
            const filter = makeFilter({ year: { $in: [1900, 1910, 1920] } });
            expect(filter({ year: 1910 })).toBe(true);
            expect(filter({ year: 1880 })).toBe(false);
            expect(filter({})).toBe(false);
        });

        test('$in with array field', () => {
            const filter = makeFilter({ tags: { $in: ['modern', 'romantic'] } });
            expect(filter({ tags: ['baroque', 'modern'] })).toBe(true);
            expect(filter({ tags: ['classical', 'renaissance'] })).toBe(false);
        });

        test('$in with empty array (should match nothing)', () => {
            const filter = makeFilter({ era: { $in: [] } });
            expect(filter({ era: 'impressionist' })).toBe(false);
            expect(filter({ era: 'baroque' })).toBe(false);
        });

        test('$all', () => {
            const filter = makeFilter({ instruments: { $all: ['piano', 'violin'] } });
            expect(filter({ instruments: ['piano', 'violin', 'flute'] })).toBe(true);
            expect(filter({ instruments: ['piano', 'violin'] })).toBe(true);
            expect(filter({ instruments: ['piano', 'flute'] })).toBe(false);
            expect(filter({ instruments: ['flute'] })).toBe(false);
            expect(filter({})).toBe(false);
        });

        test('$all with non-array field (scalar)', () => {
            const filter = makeFilter({ instrument: { $all: ['piano'] } });
            expect(filter({ instrument: 'piano' })).toBe(true);
            expect(filter({ instrument: 'violin' })).toBe(false);
        });

        test('$all with empty array (should match everything)', () => {
            const filter = makeFilter({ instruments: { $all: [] } });
            expect(filter({ instruments: ['piano'] })).toBe(true);
            expect(filter({ instruments: [] })).toBe(true);
            expect(filter({ instruments: undefined })).toBe(true);
        });

        test('$in with non-array field', () => {
            const filter = makeFilter({ year: { $in: [1900, 1910, 1920] } });
            expect(filter({ year: 1910 })).toBe(true);
            expect(filter({ year: 1880 })).toBe(false);
            expect(filter({})).toBe(false);
        });

        test('$nin with non-array field', () => {
            const filter = makeFilter({ year: { $nin: [1900, 1910, 1920] } });
            expect(filter({ year: 1910 })).toBe(false);
            expect(filter({ year: 1880 })).toBe(true);
            expect(filter({})).toBe(true);
        });

        test('$nin with array field', () => {
            const filter = makeFilter({ tags: { $nin: ['modern', 'romantic'] } });
            expect(filter({ tags: ['baroque', 'modern'] })).toBe(false);
            expect(filter({ tags: ['classical', 'renaissance'] })).toBe(true);
        });

        test('$nin with empty array (should match everything)', () => {
            const filter = makeFilter({ era: { $nin: [] } });
            expect(filter({ era: 'impressionist' })).toBe(true);
            expect(filter({ era: 'baroque' })).toBe(true);
        });
    });

    describe('$like condition', () => {
        test('Matches correctly without wildcard tokens, trimming whitespace.', () => {
            const filter = makeFilter({ name: { $like: ' Ravel' } });
            expect(filter({ name: 'Ravel ' })).toBe(true);
            expect(filter({ name: 'Maurice' })).toBe(false);
            expect(filter({ name: ['Ravel ', 'Maurice'] })).toBe(true);
            expect(filter({})).toBe(false);
        });

        test('Matches "?" as a single character', () => {
            const filter = makeFilter({ name: { $like: 'Ra?el' } });
            expect(filter({ name: 'Ravel' })).toBe(true);
            expect(filter({ name: 'Ravvel' })).toBe(false);
        });

        test('Matches "*" as multiple characters', () => {
            const filter = makeFilter({ name: { $like: 'M* R*' } });
            expect(filter({ name: 'Maurice Ravel' })).toBe(true);
            expect(filter({ name: 'Claude Debussy' })).toBe(false);
        });

        test('Matches "%" as multiple characters', () => {
            const filter = makeFilter({ name: { $like: 'M% R%' } });
            expect(filter({ name: 'Maurice Ravel' })).toBe(true);
            expect(filter({ name: 'Claude Debussy' })).toBe(false);
        });

        test('Case sensitive by default', () => {
            const filter = makeFilter({ name: { $like: 'Ravel' } });
            expect(filter({ name: 'ravel' })).toBe(false);
            expect(filter({ name: 'Ravel' })).toBe(true);
        });

        test('With $caseInsensitive=true', () => {
            const filter = makeFilter({ name: { $like: 'Ravel', $caseInsensitive: true } });
            expect(filter({ name: 'ravel' })).toBe(true);
            expect(filter({ name: 'RAVEL' })).toBe(true);
            expect(filter({ name: 'Debussy' })).toBe(false);
        });

        test('With $caseInsensitive=false', () => {
            const filter = makeFilter({ name: { $like: 'Ravel', $caseInsensitive: false } });
            expect(filter({ name: 'ravel' })).toBe(false);
            expect(filter({ name: 'RAVEL' })).toBe(false);
            expect(filter({ name: 'Ravel' })).toBe(true);
        });
    });

    describe('$unlike condition', () => {
        test('Matches correctly without wildcard tokens, trimming whitespace.', () => {
            const filter = makeFilter({ name: { $unlike: ' Ravel' } });
            expect(filter({ name: 'Ravel ' })).toBe(false);
            expect(filter({ name: 'Maurice' })).toBe(true);
            expect(filter({ name: ['Maurice', 'Ravel'] })).toBe(false);
        });

        test('Matches "?" as a single character', () => {
            const filter = makeFilter({ name: { $unlike: 'Ra?el' } });
            expect(filter({ name: 'Ravel' })).toBe(false);
            expect(filter({ name: 'Ravvel' })).toBe(true);
        });

        test('Matches "*" as multiple characters', () => {
            const filter = makeFilter({ name: { $unlike: 'M* R*' } });
            expect(filter({ name: 'Maurice Ravel' })).toBe(false);
            expect(filter({ name: 'Claude Debussy' })).toBe(true);
        });

        test('Matches "%" as multiple characters', () => {
            const filter = makeFilter({ name: { $unlike: 'M% R%' } });
            expect(filter({ name: 'Maurice Ravel' })).toBe(false);
            expect(filter({ name: 'Claude Debussy' })).toBe(true);
        });

        test('Case sensitive by default', () => {
            const filter = makeFilter({ name: { $unlike: 'Ravel' } });
            expect(filter({ name: 'ravel' })).toBe(true);
            expect(filter({ name: 'Ravel' })).toBe(false);
        });

        test('With $caseInsensitive=true', () => {
            const filter = makeFilter({ name: { $unlike: 'Ravel', $caseInsensitive: true } });
            expect(filter({ name: 'ravel' })).toBe(false);
            expect(filter({ name: 'RAVEL' })).toBe(false);
            expect(filter({ name: 'Debussy' })).toBe(true);
        });

        test('With $caseInsensitive=false', () => {
            const filter = makeFilter({ name: { $unlike: 'Ravel', $caseInsensitive: false } });
            expect(filter({ name: 'ravel' })).toBe(true);
            expect(filter({ name: 'RAVEL' })).toBe(true);
            expect(filter({ name: 'Ravel' })).toBe(false);
        });
    });

    describe('$includes condition', () => {
        test('Matches partial correctly, trimming whitespace.', () => {
            const filter = makeFilter({ name: { $includes: ' vel' } });
            expect(filter({ name: 'Ravel ' })).toBe(true);
            expect(filter({ name: 'Debussy' })).toBe(false);
            expect(filter({ name: ['Ravel ', 'Debussy'] })).toBe(true);
        });

        test('Matches entire phrase correctly, trimming whitespace.', () => {
            const filter = makeFilter({ name: { $includes: ' Ravel' } });
            expect(filter({ name: 'Ravel ' })).toBe(true);
            expect(filter({ name: 'Debussy' })).toBe(false);
        });

        test('Case sensitive by default', () => {
            const filter = makeFilter({ name: { $includes: 'Ravel' } });
            expect(filter({ name: 'ravel' })).toBe(false);
            expect(filter({ name: 'Ravel' })).toBe(true);
        });

        test('With $caseInsensitive=true', () => {
            const filter = makeFilter({ name: { $includes: 'Rav', $caseInsensitive: true } });
            expect(filter({ name: 'ravel' })).toBe(true);
            expect(filter({ name: 'RAVEL' })).toBe(true);
            expect(filter({ name: 'Debussy' })).toBe(false);
        });

        test('With $caseInsensitive=false', () => {
            const filter = makeFilter({ name: { $includes: 'Rav', $caseInsensitive: false } });
            expect(filter({ name: 'ravel' })).toBe(false);
            expect(filter({ name: 'RAVEL' })).toBe(false);
            expect(filter({ name: 'Ravel' })).toBe(true);
        });
    });

    describe('$excludes condition', () => {
        test('Matches partial correctly, trimming whitespace.', () => {
            const filter = makeFilter({ name: { $excludes: ' ve' } });
            expect(filter({ name: 'Ravel ' })).toBe(false);
            expect(filter({ name: 'Rav' })).toBe(true);
            expect(filter({ name: ['Rav', 'Ravel '] })).toBe(false);
        });

        test('Matches entire phrase correctly, trimming whitespace.', () => {
            const filter = makeFilter({ name: { $excludes: ' Ravel' } });
            expect(filter({ name: 'Ravel ' })).toBe(false);
            expect(filter({ name: 'Debussy' })).toBe(true);
        });

        test('Case sensitive by default', () => {
            const filter = makeFilter({ name: { $excludes: 'Ravel' } });
            expect(filter({ name: 'ravel' })).toBe(true);
            expect(filter({ name: 'RAVEL' })).toBe(true);
            expect(filter({ name: 'Ravel' })).toBe(false);
        });

        test('With $caseInsensitive=true', () => {
            const filter = makeFilter({ name: { $excludes: 'Rav', $caseInsensitive: true } });
            expect(filter({ name: 'ravel' })).toBe(false);
            expect(filter({ name: 'RAVEL' })).toBe(false);
            expect(filter({ name: 'Debussy' })).toBe(true);
        });

        test('With $caseInsensitive=false', () => {
            const filter = makeFilter({ name: { $excludes: 'Rav', $caseInsensitive: false } });
            expect(filter({ name: 'ravel' })).toBe(true);
            expect(filter({ name: 'RAVEL' })).toBe(true);
            expect(filter({ name: 'Ravel' })).toBe(false);
        });
    });

    describe('$prefix condition', () => {
        test('Matches correctly without, trimming whitespace.', () => {
            const filter = makeFilter({ name: { $prefix: 'Maurice' } });
            expect(filter({ name: ' Maurice Ravel ' })).toBe(true);
            expect(filter({ name: 'Ravel ' })).toBe(false);
            expect(filter({ name: [' Maurice Ravel ', 'Ravel '] })).toBe(true);
        });

        test('Case sensitive by default', () => {
            const filter = makeFilter({ name: { $prefix: 'Rav' } });
            expect(filter({ name: 'ravel' })).toBe(false);
            expect(filter({ name: 'RAVEL' })).toBe(false);
            expect(filter({ name: 'Ravel' })).toBe(true);
        });

        test('With $caseInsensitive=true', () => {
            const filter = makeFilter({ name: { $prefix: 'Rav', $caseInsensitive: true } });
            expect(filter({ name: 'ravel' })).toBe(true);
            expect(filter({ name: 'RAVEL' })).toBe(true);
            expect(filter({ name: 'Debussy' })).toBe(false);
        });

        test('With $caseInsensitive=false', () => {
            const filter = makeFilter({ name: { $prefix: 'Rav', $caseInsensitive: false } });
            expect(filter({ name: 'ravel' })).toBe(false);
            expect(filter({ name: 'RAVEL' })).toBe(false);
            expect(filter({ name: 'Ravel' })).toBe(true);
        });
    });

    describe('$ids condition', () => {
        test('Matches correctly', () => {
            const filter = makeFilter({ id: { $ids: [1, 2, 3] } });
            expect(filter({ id: 1, name: ' Maurice Ravel ' })).toBe(true);
            expect(filter({ id: 5, name: ' Maurice Ravel ' })).toBe(false);
        });
    });

    describe('$empty condition', () => {
        test('Matches correctly when operands have a value', () => {
            expect(makeFilter({ name: { $empty: true } })({ name: 'Maurice Ravel ' })).toBe(false);
            expect(makeFilter({ name: { $empty: false } })({ name: 'Maurice Ravel ' })).toBe(true);
        });

        test('Matches correctly when values are missing', () => {
            expect(makeFilter({ id: { $empty: true } })({ name: 'Maurice Ravel ' })).toBe(true);
            expect(makeFilter({ id: { $empty: false } })({ name: 'Maurice Ravel ' })).toBe(false);
        });

        test('Matches correctly when values are empty strings (after trimming)', () => {
            expect(makeFilter({ name: { $empty: true } })({ name: ' ' })).toBe(true);
            expect(makeFilter({ name: { $empty: true } })({ name: [' '] })).toBe(true);
            expect(makeFilter({ name: { $empty: false } })({ name: ' ' })).toBe(false);
        });

        test('Matches empty arrays corrects', () => {
            expect(makeFilter({ name: { $empty: true } })({ name: [] })).toBe(true);
            expect(makeFilter({ name: { $empty: false } })({ name: [] })).toBe(false);
        });
    });

    describe('$nempty condition', () => {
        test('Matches correctly when operands have a value', () => {
            expect(makeFilter({ name: { $nempty: true } })({ name: 'Maurice Ravel ' })).toBe(true);
            expect(makeFilter({ name: { $nempty: false } })({ name: 'Maurice Ravel ' })).toBe(false);
            expect(makeFilter({ name: { $nempty: false } })({ name: ['Maurice Ravel '] })).toBe(false);
        });

        test('Matches correctly when values are missing', () => {
            expect(makeFilter({ id: { $nempty: true } })({ name: 'Maurice Ravel ' })).toBe(false);
            expect(makeFilter({ id: { $nempty: false } })({ name: 'Maurice Ravel ' })).toBe(true);
        });

        test('Matches correctly when values are empty strings (after trimming)', () => {
            expect(makeFilter({ name: { $nempty: true } })({ name: ' ' })).toBe(false);
            expect(makeFilter({ name: { $nempty: false } })({ name: ' ' })).toBe(true);
        });

        test('Matches empty arrays corrects', () => {
            expect(makeFilter({ name: { $nempty: true } })({ name: [] })).toBe(false);
            expect(makeFilter({ name: { $nempty: false } })({ name: [] })).toBe(true);
        });
    });

    describe('simple comparative conditions', () => {
        test('$lt', () => {
            const makeFilterer = makeFilter({ value: { $lt: 0 } });
            expect(makeFilterer({ value: -1 })).toBe(true);
            expect(makeFilterer({ value: 0 })).toBe(false);
            expect(makeFilterer({ value: 1 })).toBe(false);
            expect(makeFilterer({ value: [-1, 0, 1] })).toBe(true);
        });

        test('$lte', () => {
            const makeFilterer = makeFilter({ value: { $lte: 0 } });
            expect(makeFilterer({ value: -1 })).toBe(true);
            expect(makeFilterer({ value: 0 })).toBe(true);
            expect(makeFilterer({ value: 1 })).toBe(false);
            expect(makeFilterer({ value: [-1, 0, 1] })).toBe(true);
        });

        test('$gt', () => {
            const makeFilterer = makeFilter({ value: { $gt: 0 } });
            expect(makeFilterer({ value: 1 })).toBe(true);
            expect(makeFilterer({ value: 0 })).toBe(false);
            expect(makeFilterer({ value: -11 })).toBe(false);
            expect(makeFilterer({ value: [1, 0, -11] })).toBe(true);
        });

        test('$gte', () => {
            const makeFilterer = makeFilter({ value: { $gte: 0 } });
            expect(makeFilterer({ value: 1 })).toBe(true);
            expect(makeFilterer({ value: 0 })).toBe(true);
            expect(makeFilterer({ value: -11 })).toBe(false);
            expect(makeFilterer({ value: [1, 0, -11] })).toBe(true);
        });

        test('compares dates properly, including date math', () => {
            const now = new Date();
            expect(makeFilter({ value: { $lt: now.getTime() } })({ value: now })).toBe(false);
            expect(makeFilter({ value: { $lte: now.getTime() } })({ value: now })).toBe(true);
            expect(makeFilter({ value: { $lt: 'now+1h' } })({ value: now.getTime() })).toBe(true);
            expect(makeFilter({ value: { $gt: 'now+1h' } })({ value: now.getTime() })).toBe(false);
            expect(makeFilter({ value: { $lt: 'now-1h' } })({ value: now })).toBe(false);
            expect(makeFilter({ value: { $gt: 'now-1h' } })({ value: now })).toBe(true);
            expect(makeFilter({ value: { $gte: '2025-12-30||/y' } })({ value: '2026-01-01' })).toBe(true);
        });
    });

    describe('$between condition', () => {
        test('Matches correctly for numbers (inclusive by default)', () => {
            const filter = makeFilter({ value: { $between: [1, 5] } });
            expect(filter({ value: 3 })).toBe(true);
            expect(filter({ value: 1 })).toBe(true);
            expect(filter({ value: 5 })).toBe(true);
            expect(filter({ value: 0 })).toBe(false);
            expect(filter({ value: 10 })).toBe(false);
            expect(filter({ value: [1, 3, 5, 10] })).toBe(true);
        });

        test('Handles $exclusive=false option', () => {
            const filter = makeFilter({ value: { $between: [1, 5], $exclusive: false } });
            expect(filter({ value: 3 })).toBe(true);
            expect(filter({ value: 1 })).toBe(true);
            expect(filter({ value: 5 })).toBe(true);
        });

        test('Handles $exclusive=true option', () => {
            const filter = makeFilter({ value: { $between: [1, 5], $exclusive: true } });
            expect(filter({ value: 3 })).toBe(true);
            expect(filter({ value: 1 })).toBe(false);
            expect(filter({ value: 5 })).toBe(false);
        });

        test('Handles exclusive=min option', () => {
            const filter = makeFilter({ value: { $between: [1, 5], $exclusive: 'min' } });
            expect(filter({ value: 3 })).toBe(true);
            expect(filter({ value: 1 })).toBe(false);
            expect(filter({ value: 5 })).toBe(true);
        });

        test('Handles exclusive=max option', () => {
            const filter = makeFilter({ value: { $between: [1, 5], $exclusive: 'max' } });
            expect(filter({ value: 3 })).toBe(true);
            expect(filter({ value: 1 })).toBe(true);
            expect(filter({ value: 5 })).toBe(false);
        });

        test('Matches correctly for strings', () => {
            const filter = makeFilter({ value: { $between: ['bravo', 'delta'] } });
            expect(filter({ value: 'charlie' })).toBe(true);
            expect(filter({ value: 'bravo' })).toBe(true);
            expect(filter({ value: 'delta' })).toBe(true);
            expect(filter({ value: 'alpha' })).toBe(false);
            expect(filter({ value: 'echo' })).toBe(false);
        });

        test('Matches correctly for dates', () => {
            const filter = makeFilter({ value: { $between: ['now-1m', 'now+1m'] } });
            const now = Date.now();
            expect(filter({ value: now })).toBe(true);
            expect(filter({ value: now - 1000 * 60 * 2 })).toBe(false);
            expect(filter({ value: now + 1000 * 60 * 2 })).toBe(false);
        });
    });

    describe('$near condition', () => {
        // arc distance between downtown jax and bermuda triangle ~ 8206 miles (13207km, 2.07 earth radians)
        // plane distance between downtown jax and jax beach ~ 15 miles (25km)
        const jaxDowntown = [-81.655647, 30.332184];
        const jaxBeach = [-81.3961, 30.2841];
        const bermudaTriangle = [71, 25];

        test('with default distance type (arc)', () => {
            expect(
                makeFilter({ location: { $near: bermudaTriangle, $maxDistance: '8207mi' } })({
                    location: jaxDowntown,
                })
            ).toBe(true);

            expect(
                makeFilter({ location: { $near: bermudaTriangle, $maxDistance: '8205mi' } })({
                    location: jaxDowntown,
                })
            ).toBe(false);

            expect(
                makeFilter({ location: { $near: jaxBeach, $maxDistance: '20mi' } })({
                    location: [jaxDowntown, bermudaTriangle],
                })
            ).toBe(true);
        });

        test('with explicit arc distance type', () => {
            expect(
                makeFilter({ location: { $near: bermudaTriangle, $maxDistance: '8207mi', $distanceType: 'arc' } })({
                    location: jaxDowntown,
                })
            ).toBe(true);

            expect(
                makeFilter({ location: { $near: bermudaTriangle, $maxDistance: '8205mi', $distanceType: 'arc' } })({
                    location: jaxDowntown,
                })
            ).toBe(false);
        });

        test('with explicit plane distance type', () => {
            expect(
                makeFilter({ location: { $near: jaxBeach, $maxDistance: '16mi', $distanceType: 'plane' } })({
                    location: jaxDowntown,
                })
            ).toBe(true);

            expect(
                makeFilter({ location: { $near: jaxBeach, $maxDistance: '14mi', $distanceType: 'plane' } })({
                    location: jaxDowntown,
                })
            ).toBe(false);
        });

        test('supports lon/lat objects', () => {
            const bermudaTriangleLonLat = { lon: bermudaTriangle[0], lat: bermudaTriangle[1] };
            const jaxDowntownLonLat = { lon: jaxDowntown[0], lat: jaxDowntown[1] };

            expect(
                makeFilter({ location: { $near: bermudaTriangleLonLat, $maxDistance: '8207mi' } })({
                    location: jaxDowntownLonLat,
                })
            ).toBe(true);

            expect(
                makeFilter({ location: { $near: bermudaTriangleLonLat, $maxDistance: '8205mi' } })({
                    location: jaxDowntownLonLat,
                })
            ).toBe(false);
        });

        test('handles units correctly', () => {
            expect(
                makeFilter({ location: { $near: bermudaTriangle, $maxDistance: '8207miles' } })({
                    location: jaxDowntown,
                })
            ).toBe(true);

            expect(
                makeFilter({ location: { $near: bermudaTriangle, $maxDistance: '8205miles' } })({
                    location: jaxDowntown,
                })
            ).toBe(false);

            expect(
                makeFilter({ location: { $near: bermudaTriangle, $maxDistance: '13208km' } })({
                    location: jaxDowntown,
                })
            ).toBe(true);

            expect(
                makeFilter({ location: { $near: bermudaTriangle, $maxDistance: '13206km' } })({
                    location: jaxDowntown,
                })
            ).toBe(false);

            expect(
                makeFilter({ location: { $near: bermudaTriangle, $maxDistance: '13208kilometers' } })({
                    location: jaxDowntown,
                })
            ).toBe(true);

            expect(
                makeFilter({ location: { $near: bermudaTriangle, $maxDistance: '13206kilometers' } })({
                    location: jaxDowntown,
                })
            ).toBe(false);

            expect(
                makeFilter({ location: { $near: bermudaTriangle, $maxDistance: 2.08 } })({
                    location: jaxDowntown,
                })
            ).toBe(true);

            expect(
                makeFilter({ location: { $near: bermudaTriangle, $maxDistance: 2.06 } })({
                    location: jaxDowntown,
                })
            ).toBe(false);

            expect(() =>
                makeFilter({ location: { $near: bermudaTriangle, $maxDistance: '13206m' } })({
                    location: jaxDowntown,
                })
            ).toThrow();
        });
    });

    describe('compound conditions', () => {
        test('$and', () => {
            const filter = makeFilter({ $and: [{ firstName: 'Maurice' }, { lastName: 'Ravel' }] });
            expect(filter({ firstName: 'Maurice', lastName: 'Ravel' })).toBe(true);
            expect(filter({ firstName: 'Claude', lastName: 'Debussy' })).toBe(false);
            expect(filter({ firstName: 'Maurice', lastName: 'Debussy' })).toBe(false);
        });

        test('$or', () => {
            const filter = makeFilter({ $or: [{ firstName: 'Maurice' }, { lastName: 'Ravel' }] });
            expect(filter({ firstName: 'Maurice', lastName: 'Ravel' })).toBe(true);
            expect(filter({ firstName: 'Claude', lastName: 'Debussy' })).toBe(false);
            expect(filter({ firstName: 'Maurice', lastName: 'Debussy' })).toBe(true);
            expect(filter({ firstName: 'Claude', lastName: 'Ravel' })).toBe(true);
        });

        test('$nor', () => {
            const filter = makeFilter({ $nor: [{ firstName: 'Maurice' }, { lastName: 'Ravel' }] });
            expect(filter({ firstName: 'Maurice', lastName: 'Ravel' })).toBe(false);
            expect(filter({ firstName: 'Claude', lastName: 'Debussy' })).toBe(true);
            expect(filter({ firstName: 'Maurice', lastName: 'Debussy' })).toBe(false);
            expect(filter({ firstName: 'Claude', lastName: 'Ravel' })).toBe(false);
        });

        test('$not', () => {
            const filter = makeFilter({ $not: { firstName: 'Maurice' } });
            expect(filter({ firstName: 'Maurice', lastName: 'Ravel' })).toBe(false);
            expect(filter({ firstName: 'Claude', lastName: 'Debussy' })).toBe(true);
        });
    });

    describe('$elemMatch condition', () => {
        test('standard query', () => {
            const filter = makeFilter({ tags: { $elemMatch: { key: 'occupation', value: { $eq: 'composer' } } } });
            expect(filter({ tags: [{ key: 'occupation', value: 'composer' }] })).toBe(true);
            expect(filter({ tags: [{ key: 'name', value: 'Maurice' }] })).toBe(false);
            expect(filter({ tags: [{ key: 'job', value: 'composer' }] })).toBe(false);
        });

        test('compound  query', () => {
            const filter = makeFilter({ tags: { $elemMatch: { $not: { key: 'occupation', value: { $eq: 'composer' } } } } });
            expect(filter({ tags: [{ key: 'occupation', value: 'composer' }] })).toBe(false);
            expect(filter({ tags: [{ key: 'name', value: 'Maurice' }] })).toBe(true);
            expect(filter({ tags: [{ key: 'job', value: 'composer' }] })).toBe(true);
        });

        test('nested $elemMatch', () => {
            const filter = makeFilter({
                works: {
                    $elemMatch: {
                        title: 'Bolero',
                        performers: {
                            $elemMatch: { name: 'Maurice Ravel', instrument: 'piano' },
                        },
                    },
                },
            });

            expect(
                filter({
                    works: [
                        {
                            title: 'Bolero',
                            performers: [
                                { name: 'Maurice Ravel', instrument: 'piano' },
                                { name: 'Jane Doe', instrument: 'violin' },
                            ],
                        },
                        {
                            title: 'Daphnis et Chloé',
                            performers: [{ name: 'Maurice Ravel', instrument: 'conductor' }],
                        },
                    ],
                })
            ).toBe(true);

            expect(
                filter({
                    works: [
                        {
                            title: 'Bolero',
                            performers: [
                                { name: 'Maurice Ravel', instrument: 'conductor' },
                                { name: 'Jane Doe', instrument: 'violin' },
                            ],
                        },
                        {
                            title: 'Daphnis et Chloé',
                            performers: [{ name: 'Maurice Ravel', instrument: 'conductor' }],
                        },
                    ],
                })
            ).toBe(false);

            expect(
                filter({
                    works: [
                        {
                            title: 'Bolero',
                            performers: [{ name: 'Jane Doe', instrument: 'violin' }],
                        },
                    ],
                })
            ).toBe(false);
        });
    });

    describe('supports nested objects using dot notation', () => {
        const data = {
            name: { first: 'Maurice', last: 'Ravel' },
            works: [
                { name: 'La Valse', key: 'D', year: 1919, info: { length: 300 } },
                { name: 'Bolero', key: 'C', year: 1928, info: { length: 500 } },
            ],
        };

        test('simple property access', () => {
            expect(makeFilter({ 'name.last': 'Ravel' })(data)).toBe(true);
            expect(makeFilter({ 'name.first': 'Ravel' })(data)).toBe(false);
            expect(makeFilter({ 'name.middle': '' })(data)).toBe(false);
        });

        test('array access', () => {
            expect(makeFilter({ 'works.key': 'D' })(data)).toBe(true);
            expect(makeFilter({ 'works.key': 'C' })(data)).toBe(true);
            expect(makeFilter({ 'works.key': 'F#' })(data)).toBe(false);
        });

        test('deeply nested ', () => {
            expect(makeFilter({ 'works.info.length': { $between: [100, 500] } })(data)).toBe(true);
            expect(makeFilter({ 'works.info.length': { $between: [400, 450] } })(data)).toBe(false);
        });
    });

    describe('supports the most complicated (yet practical) test cases imaginable', () => {
        test('adjacent compound operators', () => {
            const filter = makeFilter({
                instrument: 'piano',
                $and: [{ year: { $gt: 1928 } }],
                $or: [{ firstName: 'Maurice' }, { firstName: 'Claude' }],
                $not: { works: { $in: ['Clair de lune'] } },
            });

            expect(filter({ instrument: 'piano', year: 1930, firstName: 'Maurice', lastName: 'Ravel', works: ['Bolero'] })).toBe(true);
            expect(filter({ instrument: 'conductor', year: 1930, firstName: 'Maurice', lastName: 'Ravel', works: ['Bolero'] })).toBe(false);
            expect(filter({ instrument: 'piano', year: 1928, firstName: 'Maurice', lastName: 'Ravel', works: ['Bolero'] })).toBe(false);
            expect(filter({ instrument: 'piano', year: 1930, firstName: 'Claude', lastName: 'Debussy', works: ['Clair de lune'] })).toBe(
                false
            );
            expect(filter({ instrument: 'piano', year: 1930, firstName: 'Erik', lastName: 'Satie', works: ['Gymnopedie No. 1'] })).toBe(
                false
            );
        });

        test('$or with implicit $and', () => {
            const filter = makeFilter({ $or: [{ composer: 'Debussy' }, { composer: 'Ravel' }], year: { $gt: 1928 } });
            expect(filter({ composer: 'Debussy', year: 1930 })).toBe(true);
            expect(filter({ composer: 'Ravel', year: 1930 })).toBe(true);
            expect(filter({ composer: 'Chopin', year: 1930 })).toBe(false);
            expect(filter({ composer: 'Debussy', year: 1925 })).toBe(false);
            expect(filter({ composer: 'Debussy' })).toBe(false);
        });

        test('nested $or and $and with implicit $eq', () => {
            const filter = makeFilter({
                $or: [
                    { composer: 'Debussy' },
                    {
                        $and: [{ era: 'impressionist' }, { nationality: 'French' }],
                    },
                ],
            });
            expect(filter({ composer: 'Debussy', era: 'romantic', nationality: 'French' })).toBe(true);
            expect(filter({ composer: 'Ravel', era: 'impressionist', nationality: 'French' })).toBe(true);
            expect(filter({ composer: 'Ravel', era: 'romantic', nationality: 'French' })).toBe(false);
            expect(filter({ composer: 'Chopin', era: 'romantic', nationality: 'Polish' })).toBe(false);
        });

        test('multiple compound conditions', () => {
            const filter = makeFilter({
                $and: [
                    { composer: { $in: ['Debussy', 'Ravel'] } },
                    {
                        $or: [{ era: 'impressionist' }, { nationality: 'French' }],
                    },
                ],
            });
            expect(filter({ composer: 'Debussy', era: 'impressionist', nationality: 'French' })).toBe(true);
            expect(filter({ composer: 'Ravel', era: 'romantic', nationality: 'French' })).toBe(true);
            expect(filter({ composer: 'Ravel', era: 'baroque', nationality: 'German' })).toBe(false);
            expect(filter({ composer: 'Chopin', era: 'romantic', nationality: 'French' })).toBe(false);
        });

        test('$elemMatch with $like and $not', () => {
            const filter = makeFilter({
                works: {
                    $elemMatch: {
                        title: { $like: '*Bolero*' },
                        $not: { year: { $lt: 1920 } },
                    },
                },
            });
            expect(filter({ works: [{ title: 'Bolero', year: 1928 }] })).toBe(true);
            expect(filter({ works: [{ title: 'Bolero', year: 1918 }] })).toBe(false);
            expect(filter({ works: [{ title: 'Daphnis et Chloé', year: 1912 }] })).toBe(false);
        });

        test('$nor with $exists and $empty', () => {
            const filter = makeFilter({
                $nor: [{ opus: { $exists: false } }, { nickname: { $empty: true } }],
            });
            expect(filter({ composer: 'Debussy', opus: 23, nickname: 'Claude' })).toBe(true);
            expect(filter({ composer: 'Ravel', nickname: '' })).toBe(false);
            expect(filter({ composer: 'Ravel' })).toBe(false);
        });
    });
});
