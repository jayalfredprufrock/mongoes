import type { NegatedOperator, NegatedOperators } from './constants';
import type { BasicOperatorOperands, BasicOperatorOptions, BasicOperator } from './operators';

export type CustomOperator = (field: string, operand: any, options: Record<string, any>) => any;
export type CustomOperators = Record<`$${string}`, CustomOperator>;

export type EmptyObj = Record<string, never>;

export type Condition = {
    operator: BasicOperator | CustomOperator;
    operand: any;
    options: Record<string, any>;
    negated?: boolean;
};

export type Primitive = string | boolean | number;
export type IsPrimitive<T> = T extends Primitive ? true : false;

export type MaybeArray<T> = T | T[];

export interface ConvertQueryConfig {
    operators?: CustomOperators;
}

export type Location = [number, number] | { lon: number; lat: number };
export type LocationDistanceUnit = 'miles' | 'mi' | 'kilometers' | 'km';
export type LocationDistance = number | `${number}${LocationDistanceUnit}`;

export interface CompoundConditions<Schema> {
    $and?: MongoesQuery<Schema>[];
    $or?: MongoesQuery<Schema>[];
    $nor?: MongoesQuery<Schema>[];
    $not?: MongoesQuery<Schema>;
}

export type SimpleOperator = BasicOperator | NegatedOperator;

export type SimpleOperatorOperand<T extends SimpleOperator> = BasicOperatorOperands[T extends NegatedOperator ? NegatedOperators[T] : T];
export type SimpleOperatorOptions<T extends SimpleOperator> = BasicOperatorOptions[T extends NegatedOperator ? NegatedOperators[T] : T];

export type SimpleConditionsAsNever = {
    [K in SimpleOperator]?: never;
};

type UnwrapArray<T> = T extends (infer U)[] ? U : T;
type ForbidArray<T, U> = T extends unknown[] ? never : U;
// eslint-disable-next-line @typescript-eslint/ban-types
type ResolveOptions<T> = T extends undefined ? {} : T;

export type EnforceType<
    SO extends SimpleOperator,
    FieldType,
    Condition,
    RequiredFieldType = SimpleOperatorOperand<SO>,
> = FieldType extends RequiredFieldType ? Omit<SimpleConditionsAsNever, SO> & Condition & ResolveOptions<SimpleOperatorOptions<SO>> : never;

// equality (use T here to prevent widening of literal types)
export type $Eq<T> = ForbidArray<T, Omit<SimpleConditionsAsNever, '$eq'> & { $eq: T }>;
export type $Ne<T> = ForbidArray<T, Omit<SimpleConditionsAsNever, '$ne'> & { $ne: T }>;

// array-based (use T here to prevent widening of literal types)
export type $In<T> = Omit<SimpleConditionsAsNever, '$in'> & { $in: UnwrapArray<T>[] };
export type $Nin<T> = Omit<SimpleConditionsAsNever, '$nin'> & { $nin: UnwrapArray<T>[] };
export type $All<T> = Omit<SimpleConditionsAsNever, '$all'> & { $all: UnwrapArray<T>[] };

// range-based (numbers, strings, Dates)
export type $Lt<T> = EnforceType<'$lt', T, { $lt: SimpleOperatorOperand<'$lt'> }>;
export type $Lte<T> = EnforceType<'$lte', T, { $lte: SimpleOperatorOperand<'$lte'> }>;
export type $Gt<T> = EnforceType<'$gt', T, { $gt: SimpleOperatorOperand<'$gt'> }>;
export type $Gte<T> = EnforceType<'$gte', T, { $gte: SimpleOperatorOperand<'$gte'> }>;
export type $Between<T> = EnforceType<'$between', [T, T], { $between: SimpleOperatorOperand<'$between'> }>;

// string-based
export type $Regex<T> = EnforceType<'$regex', T, { $regex: SimpleOperatorOperand<'$regex'> }>;
export type $Like<T> = EnforceType<'$like', T, { $like: SimpleOperatorOperand<'$like'> }>;
export type $Unlike<T> = EnforceType<'$unlike', T, { $unlike: SimpleOperatorOperand<'$unlike'> }>;
export type $Includes<T> = EnforceType<'$includes', T, { $includes: SimpleOperatorOperand<'$includes'> }>;
export type $Excludes<T> = EnforceType<'$excludes', T, { $excludes: SimpleOperatorOperand<'$excludes'> }>;
export type $Prefix<T> = EnforceType<'$prefix', T, { $prefix: SimpleOperatorOperand<'$prefix'> }>;
export type $Empty<T> = EnforceType<'$empty', T, { $empty: SimpleOperatorOperand<'$empty'> }>;
export type $Nempty<T> = EnforceType<'$nempty', T, { $nempty: SimpleOperatorOperand<'$nempty'> }>;

// special
export type $Near<T> = EnforceType<'$near', T, { $near: SimpleOperatorOperand<'$near'> }>;
export type $Ids<T> = EnforceType<'$ids', T, { $ids: SimpleOperatorOperand<'$ids'> }, string>;
export type $Exists = Omit<SimpleConditionsAsNever, '$exists'> & { $exists: SimpleOperatorOperand<'$exists'> };

export type BasicCondition<T> =
    | $Eq<T>
    | $Ne<T>
    | $In<T>
    | $Nin<T>
    | $All<T>
    | $Lt<T>
    | $Lte<T>
    | $Gt<T>
    | $Gte<T>
    | $Between<T>
    | $Regex<T>
    | $Like<T>
    | $Unlike<T>
    | $Includes<T>
    | $Excludes<T>
    | $Prefix<T>
    | $Empty<T>
    | $Nempty<T>
    | $Near<T>
    | $Ids<T>
    | $Exists;

export type MongoesQuery<Schema = Record<string, Primitive>> =
    | CompoundConditions<Schema>
    | {
          [K in keyof Schema]?: ForbidArray<Schema[K], Schema[K]> | BasicCondition<Schema[K]>;
      };

// Helper: Checks if T is an object (but not array)
// also don't consider lat/lon objects
export type IsLatLon<T> = T extends { lat: number; lon: number } ? true : false;
export type IsObject<T> = T extends object ? (T extends Array<any> ? false : T extends { lat: number; lon: number } ? false : true) : false;
export type IsArrayObj<T> = T extends Array<infer I> ? IsObject<I> : false;

// Main recursive type
export type DotPath<T, Prefix extends string = '', R = Required<T>> = {
    [K in keyof R]: IsObject<R[K]> extends true
        ? DotPath<R[K], `${Prefix}${K & string}.`>
        : R[K] extends Array<infer I>
          ? IsObject<I> extends true
              ? DotPath<I, `${Prefix}${K & string}.`>
              : `${Prefix}${K & string}`
          : `${Prefix}${K & string}`;
}[keyof R];

// Type to get the value type at a given dot path
export type DotPathValue<T, P extends string, R = Required<T>> = P extends `${infer K}.${infer Rest}`
    ? K extends keyof R
        ? DotPathValue<R[K], Rest>
        : never
    : R extends Array<infer I>
      ? P extends keyof I
          ? I[P][]
          : never
      : P extends keyof R
        ? R[P]
        : never;

export type Flatten<T> = {
    [K in DotPath<T>]: DotPathValue<T, K>;
};

/*
type Person = {
    name: { first: string; last: string };
    age: number;
    hobbies: string[];
    status: 'active' | 'inactive';
    enabled: boolean;
    location: { lat: number; lon: number };
    tags: { name: string; value: string | number }[];
};
export const test = <T>(query: MongoesQuery<Flatten<T>>) => true;

test<Person>({
    age: { $lt: 2 },
    $and: [{ 'name.first': 'Andrew' }, { 'name.last': { $like: 'Smiley' } }, { status: { $in: ['active'] } }],
    $or: [{ location: { $near: [1, 1], $maxDistance: '2mi' } }],
});

type Test = Flatten<Person>;
*/
