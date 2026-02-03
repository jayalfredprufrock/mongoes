import { convertQuery } from './convert-query';

describe('convertQuery()', () => {
    describe('supports basic equality/existence operators', () => {
        test('$eq', () => {
            expect(convertQuery({ name: { $eq: 'Ravel' } })).toEqual({ bool: { must: { term: { name: 'Ravel' } } } });
        });

        test('$ne', () => {
            expect(convertQuery({ name: { $ne: 'Debussy' } })).toEqual({
                bool: { must_not: { term: { name: 'Debussy' } } },
            });
        });

        test('shorthand equality', () => {
            expect(convertQuery({ name: 'Ravel' })).toEqual({ bool: { must: { term: { name: 'Ravel' } } } });
        });

        test('$exists: true', () => {
            expect(convertQuery({ name: { $exists: true } })).toEqual({ bool: { must: { exists: { field: 'name' } } } });
        });

        test('$exists: false', () => {
            expect(convertQuery({ name: { $exists: false } })).toEqual({
                bool: { must_not: { exists: { field: 'name' } } },
            });
        });

        test('$empty: true', () => {
            expect(convertQuery({ name: { $empty: true } })).toEqual({
                bool: { should: [{ bool: { must_not: { exists: { field: 'name' } } } }, { term: { name: '' } }] },
            });
        });

        test('$empty: false', () => {
            expect(convertQuery({ name: { $empty: false } })).toEqual({
                bool: { must: [{ exists: { field: 'name' } }, { bool: { must_not: { term: { name: '' } } } }] },
            });
        });

        test('$nempty: true', () => {
            expect(convertQuery({ name: { $nempty: true } })).toEqual({
                bool: { must_not: { bool: { should: [{ bool: { must_not: { exists: { field: 'name' } } } }, { term: { name: '' } }] } } },
            });
        });

        test('$nempty: false', () => {
            expect(convertQuery({ name: { $nempty: false } })).toEqual({
                bool: { must_not: { bool: { must: [{ exists: { field: 'name' } }, { bool: { must_not: { term: { name: '' } } } }] } } },
            });
        });
    });

    describe('supports range comparison operators', () => {
        ['$lt', '$lte', '$gt', '$gte'].forEach(operator => {
            test(`${operator} operator`, () => {
                expect(convertQuery({ year: { [operator]: 1928 } })).toEqual({
                    bool: { must: { range: { year: { [operator.slice(1)]: 1928 } } } },
                });
            });
        });
    });

    describe('supports range $between operator', () => {
        test('with default options (inclusive)', () => {
            expect(convertQuery({ age: { $between: [30, 40] } })).toEqual({
                bool: { must: { range: { age: { gte: 30, lte: 40 } } } },
            });
        });

        test('with explicit inclusive', () => {
            expect(convertQuery({ age: { $between: [30, 40], $exclusive: false } })).toEqual({
                bool: { must: { range: { age: { gte: 30, lte: 40 } } } },
            });
        });

        test('with explicit exclusive', () => {
            expect(convertQuery({ age: { $between: [30, 40], $exclusive: true } })).toEqual({
                bool: { must: { range: { age: { gt: 30, lt: 40 } } } },
            });
        });

        test('with explicit exclusive min', () => {
            expect(convertQuery({ age: { $between: [30, 40], $exclusive: 'min' } })).toEqual({
                bool: { must: { range: { age: { gt: 30, lte: 40 } } } },
            });
        });

        test('with explicit exclusive max', () => {
            expect(convertQuery({ age: { $between: [30, 40], $exclusive: 'max' } })).toEqual({
                bool: { must: { range: { age: { gte: 30, lt: 40 } } } },
            });
        });

        test('throws when filter operand is invalid', () => {
            expect(() => convertQuery({ age: { $between: 3 } })).toThrow();
            expect(() => convertQuery({ age: { $between: [3, 2, 1] } })).toThrow();
        });
    });

    describe('supports $near operator', () => {
        test('with default options', () => {
            expect(convertQuery({ location: { $near: [25, -71], $maxDistance: '10mi' } })).toEqual({
                bool: { must: { geo_distance: { location: [25, -71], distance: '10mi' } } },
            });
        });

        test('with type option', () => {
            expect(convertQuery({ location: { $near: [25, -71], $maxDistance: '10mi', $distanceType: 'plane' } })).toEqual({
                bool: { must: { geo_distance: { location: [25, -71], distance: '10mi', distance_type: 'plane' } } },
            });
        });

        test('with lat/lon operand', () => {
            expect(convertQuery({ location: { $near: { lon: 25, lat: -71 }, $maxDistance: '10mi' } })).toEqual({
                bool: { must: { geo_distance: { location: [25, -71], distance: '10mi' } } },
            });
        });

        test('with numeric $maxDistance treated as radians (mongodb default)', () => {
            expect(convertQuery({ location: { $near: [25, -71], $maxDistance: 10 } })).toEqual({
                bool: { must: { geo_distance: { location: [25, -71], distance: `${10 * 3959}mi` } } },
            });
        });

        test('throws when no distance option is passed', () => {
            expect(() => convertQuery({ location: { $near: [25, -71] } })).toThrow();
        });
    });

    describe('supports array based operators', () => {
        test('$in', () => {
            expect(convertQuery({ works: { $in: ['Bolero', 'La Valse'] } })).toEqual({
                bool: { must: { terms: { works: ['Bolero', 'La Valse'] } } },
            });
        });

        test('$nin', () => {
            expect(convertQuery({ works: { $nin: ['Bolero', 'La Valse'] } })).toEqual({
                bool: { must_not: { terms: { works: ['Bolero', 'La Valse'] } } },
            });
        });

        test('$all', () => {
            expect(convertQuery({ works: { $all: ['Bolero', 'La Valse'] } })).toEqual({
                bool: {
                    must: {
                        terms_set: {
                            works: { terms: ['Bolero', 'La Valse'], minimum_should_match_script: { source: 'params.num_terms' } },
                        },
                    },
                },
            });
        });

        test('$elemMatch', () => {
            expect(convertQuery({ works: { $elemMatch: { key: 'C', bpm: 130 } } })).toEqual({
                bool: {
                    must: {
                        nested: {
                            path: 'works',
                            query: {
                                bool: {
                                    must: [{ term: { 'works.key': 'C' } }, { term: { 'works.bpm': 130 } }],
                                },
                            },
                        },
                    },
                },
            });
        });

        test('$elemMatch with implicit and', () => {
            expect(convertQuery({ genre: 'jazz', works: { $elemMatch: { key: 'C', bpm: 130 } } })).toEqual({
                bool: {
                    must: [
                        { term: { genre: 'jazz' } },
                        {
                            nested: {
                                path: 'works',
                                query: {
                                    bool: {
                                        must: [{ term: { 'works.key': 'C' } }, { term: { 'works.bpm': 130 } }],
                                    },
                                },
                            },
                        },
                    ],
                },
            });
        });

        test('nested $elemMatch', () => {
            expect(
                convertQuery({ works: { $elemMatch: { key: 'C', bpm: 130, editions: { $elemMatch: { published: { $gt: 1900 } } } } } })
            ).toEqual({
                bool: {
                    must: {
                        nested: {
                            path: 'works',
                            query: {
                                bool: {
                                    must: [
                                        { term: { 'works.key': 'C' } },
                                        { term: { 'works.bpm': 130 } },
                                        {
                                            nested: {
                                                path: 'works.editions',
                                                query: {
                                                    bool: {
                                                        must: {
                                                            range: {
                                                                'works.editions.published': {
                                                                    gt: 1900,
                                                                },
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
            });
        });
    });

    describe('supports $regex operator', () => {
        test('with no flags', () => {
            expect(
                convertQuery({
                    name: { $regex: /deb.*y/ },
                })
            ).toEqual({
                bool: {
                    must: {
                        regexp: {
                            name: {
                                value: 'deb.*y',
                            },
                        },
                    },
                },
            });
        });

        test('with "i" flag', () => {
            expect(
                convertQuery({
                    name: { $regex: /deb.*y/i },
                })
            ).toEqual({
                bool: {
                    must: {
                        regexp: {
                            name: {
                                value: 'deb.*y',
                                case_insensitive: true,
                            },
                        },
                    },
                },
            });
        });

        test('string-based with no flags', () => {
            expect(
                convertQuery({
                    name: { $regex: 'deb.*y' },
                })
            ).toEqual({
                bool: {
                    must: {
                        regexp: {
                            name: {
                                value: 'deb.*y',
                            },
                        },
                    },
                },
            });
        });

        test('string-based with "i" flag', () => {
            expect(
                convertQuery({
                    name: { $regex: 'deb.*y', $options: 'i' },
                })
            ).toEqual({
                bool: {
                    must: {
                        regexp: {
                            name: {
                                value: 'deb.*y',
                                case_insensitive: true,
                            },
                        },
                    },
                },
            });
        });
    });

    describe('supports $like operator', () => {
        test('with no flags', () => {
            expect(
                convertQuery({
                    name: { $like: '*b%ss?' },
                })
            ).toEqual({
                bool: {
                    must: {
                        wildcard: {
                            name: {
                                value: '*b*ss?',
                            },
                        },
                    },
                },
            });
        });

        test('with $caseInsensitive=true', () => {
            expect(
                convertQuery({
                    name: { $like: '*b%ss?', $caseInsensitive: true },
                })
            ).toEqual({
                bool: {
                    must: {
                        wildcard: {
                            name: {
                                value: '*b*ss?',
                                case_insensitive: true,
                            },
                        },
                    },
                },
            });
        });
    });

    describe('supports $unlike operator', () => {
        test('with no flags', () => {
            expect(
                convertQuery({
                    name: { $unlike: '*b%ss?' },
                })
            ).toEqual({
                bool: {
                    must_not: {
                        wildcard: {
                            name: {
                                value: '*b*ss?',
                            },
                        },
                    },
                },
            });
        });

        test('with $caseInsensitive=true', () => {
            expect(
                convertQuery({
                    name: { $unlike: '*b%ss?', $caseInsensitive: true },
                })
            ).toEqual({
                bool: {
                    must_not: {
                        wildcard: {
                            name: {
                                value: '*b*ss?',
                                case_insensitive: true,
                            },
                        },
                    },
                },
            });
        });
    });

    describe('supports $includes operator', () => {
        test('with no flags', () => {
            expect(
                convertQuery({
                    name: { $includes: 'bus' },
                })
            ).toEqual({
                bool: {
                    must: {
                        wildcard: {
                            name: {
                                value: '*bus*',
                            },
                        },
                    },
                },
            });
        });

        test('with $caseInsensitive=true', () => {
            expect(
                convertQuery({
                    name: { $includes: 'bus', $caseInsensitive: true },
                })
            ).toEqual({
                bool: {
                    must: {
                        wildcard: {
                            name: {
                                value: '*bus*',
                                case_insensitive: true,
                            },
                        },
                    },
                },
            });
        });
    });

    describe('supports $excludes operator', () => {
        test('with no flags', () => {
            expect(
                convertQuery({
                    name: { $excludes: 'bus' },
                })
            ).toEqual({
                bool: {
                    must_not: {
                        wildcard: {
                            name: {
                                value: '*bus*',
                            },
                        },
                    },
                },
            });
        });

        test('with $caseInsensitive=true', () => {
            expect(
                convertQuery({
                    name: { $excludes: 'bus', $caseInsensitive: true },
                })
            ).toEqual({
                bool: {
                    must_not: {
                        wildcard: {
                            name: {
                                value: '*bus*',
                                case_insensitive: true,
                            },
                        },
                    },
                },
            });
        });
    });

    describe('supports $prefix operator', () => {
        test('with no flags', () => {
            expect(
                convertQuery({
                    name: { $prefix: 'deb' },
                })
            ).toEqual({
                bool: {
                    must: {
                        prefix: {
                            name: {
                                value: 'deb',
                            },
                        },
                    },
                },
            });
        });

        test('with $caseInsensitive=true', () => {
            expect(
                convertQuery({
                    name: { $prefix: 'deb', $caseInsensitive: true },
                })
            ).toEqual({
                bool: {
                    must: {
                        prefix: {
                            name: {
                                value: 'deb',
                                case_insensitive: true,
                            },
                        },
                    },
                },
            });
        });
    });

    describe('supports $ids operator', () => {
        test('without options', () => {
            expect(
                convertQuery({
                    id: { $ids: ['123', '456', '789'] },
                })
            ).toEqual({
                bool: {
                    must: {
                        ids: {
                            values: ['123', '456', '789'],
                        },
                    },
                },
            });
        });
    });

    describe('supports custom operators', () => {
        const operators = {
            $fuzz: (field: string, operand: string, options?: { $fuzziness?: number | 'AUTO' }) => {
                return { fuzzy: { [field]: { value: operand, fuzziness: options?.$fuzziness } } };
            },
            $like: (field: string, operand: string) => {
                return { like: { [field]: { value: operand } } };
            },
        };

        test('without options', () => {
            expect(convertQuery({ name: { $fuzz: 'Deub' } }, { operators })).toEqual({
                bool: { must: { fuzzy: { name: { value: 'Deub' } } } },
            });
        });

        test('with options', () => {
            expect(convertQuery({ name: { $fuzz: 'Deub', $fuzziness: 2 } }, { operators })).toEqual({
                bool: { must: { fuzzy: { name: { value: 'Deub', fuzziness: 2 } } } },
            });
        });

        test('that override built-in operators', () => {
            expect(convertQuery({ name: { $like: 'Deb' } }, { operators })).toEqual({
                bool: { must: { like: { name: { value: 'Deb' } } } },
            });
        });
    });

    describe('supports compound operators', () => {
        test('$not', () => {
            expect(convertQuery({ $not: { name: 'Debussy' } })).toEqual({
                bool: { must_not: { term: { name: 'Debussy' } } },
            });
        });

        test('$and', () => {
            expect(convertQuery({ $and: [{ firstName: 'Maurice' }, { lastName: 'Ravel' }] })).toEqual({
                bool: { must: [{ term: { firstName: 'Maurice' } }, { term: { lastName: 'Ravel' } }] },
            });
        });

        test('implicit $and', () => {
            expect(convertQuery({ name: 'Ravel', profession: 'composer' })).toEqual({
                bool: {
                    must: [{ term: { name: 'Ravel' } }, { term: { profession: 'composer' } }],
                },
            });
        });

        test('$or', () => {
            expect(convertQuery({ $or: [{ firstName: 'Maurice' }, { lastName: 'Ravel' }] })).toEqual({
                bool: { should: [{ term: { firstName: 'Maurice' } }, { term: { lastName: 'Ravel' } }], minimum_should_match: 1 },
            });
        });

        test('$nor', () => {
            expect(convertQuery({ $nor: [{ firstName: 'Maurice' }, { lastName: 'Ravel' }] })).toEqual({
                bool: { must_not: [{ term: { firstName: 'Maurice' } }, { term: { lastName: 'Ravel' } }] },
            });
        });

        test('$or within $and', () => {
            expect(
                convertQuery({
                    $and: [
                        { profession: 'composer' },
                        {
                            $or: [{ lastName: 'Ravel' }, { lastName: 'Debussy' }],
                        },
                    ],
                })
            ).toEqual({
                bool: {
                    must: [
                        { term: { profession: 'composer' } },
                        {
                            bool: {
                                should: [{ term: { lastName: 'Ravel' } }, { term: { lastName: 'Debussy' } }],
                                minimum_should_match: 1,
                            },
                        },
                    ],
                },
            });
        });

        test('$and within $or', () => {
            expect(
                convertQuery({
                    $or: [
                        { profession: 'composer' },
                        {
                            $and: [{ lastName: 'Ravel' }, { lastName: 'Debussy' }],
                        },
                    ],
                })
            ).toEqual({
                bool: {
                    should: [
                        { term: { profession: 'composer' } },
                        {
                            bool: {
                                must: [{ term: { lastName: 'Ravel' } }, { term: { lastName: 'Debussy' } }],
                            },
                        },
                    ],
                    minimum_should_match: 1,
                },
            });
        });

        test('adjacent compound operators (including implicit $and)', () => {
            expect(
                convertQuery({
                    firstName: 'Maurice',
                    $or: [{ profession: 'composer' }, { lastName: 'Ravel' }],
                    $and: [{ year: { $gt: 1928 } }],
                    $nor: [{ firstName: 'Claude' }],
                    $not: { lastName: 'Debussy' },
                })
            ).toEqual({
                bool: {
                    should: [{ term: { profession: 'composer' } }, { term: { lastName: 'Ravel' } }],
                    minimum_should_match: 1,
                    must: [{ term: { firstName: 'Maurice' } }, { range: { year: { gt: 1928 } } }],
                    must_not: [{ term: { firstName: 'Claude' } }, { term: { lastName: 'Debussy' } }],
                },
            });
        });
    });

    describe('supports the most complicated (yet practical) test cases imaginable', () => {
        test('$or with implicit $and', () => {
            expect(
                convertQuery({
                    $or: [
                        { firstName: 'Maurice', lastName: 'Ravel' },
                        { firstName: { $eq: 'Claude' }, lastName: 'Debussy' },
                    ],
                    year: { $gt: 1928 },
                })
            ).toEqual({
                bool: {
                    must: {
                        range: { year: { gt: 1928 } },
                    },
                    should: [
                        { bool: { must: [{ term: { firstName: 'Maurice' } }, { term: { lastName: 'Ravel' } }] } },
                        { bool: { must: [{ term: { firstName: 'Claude' } }, { term: { lastName: 'Debussy' } }] } },
                    ],
                    minimum_should_match: 1,
                },
            });
        });

        test('$and with nested $or', () => {
            expect(
                convertQuery({
                    year: { $gt: 1928 },
                    $and: [
                        { profession: { $eq: 'composer' } },
                        {
                            $or: [
                                { lastName: 'Ravel', $not: { firstName: 'Claude' } },
                                { lastName: 'Debussy', firstName: { $ne: 'Maurice' } },
                            ],
                        },
                    ],
                })
            ).toEqual({
                bool: {
                    must: [
                        { range: { year: { gt: 1928 } } },
                        { term: { profession: 'composer' } },
                        {
                            bool: {
                                should: [
                                    { bool: { must: { term: { lastName: 'Ravel' } }, must_not: { term: { firstName: 'Claude' } } } },
                                    { bool: { must: { term: { lastName: 'Debussy' } }, must_not: { term: { firstName: 'Maurice' } } } },
                                ],
                                minimum_should_match: 1,
                            },
                        },
                    ],
                },
            });
        });
    });

    describe('throws', () => {
        test('when using multiple operators in a single condition', () => {
            expect(() => convertQuery({ year: { $gt: 1928, $lt: 1930 } })).toThrow();
        });

        test('when encountering an unsupported operator', () => {
            expect(() => convertQuery({ field: { $bogus: 3 } })).toThrow();
        });

        test('when encountering an operator not starting with "$"', () => {
            expect(() => convertQuery({ field: { bogus: 3 } })).toThrow();
        });

        test('when encountering a missing/empty operand', () => {
            expect(() => convertQuery({ field: {} })).toThrow();
        });
    });
});
