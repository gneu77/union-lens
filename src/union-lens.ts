/* eslint-disable @typescript-eslint/naming-convention */

import { _ExtendsObject, _ToKeys } from './type-utils';

/**
 * Return type of the pick function.
 */
export type _PickReturn<T, K extends _ToKeys<T>> = T extends Array<infer A>
  ? A | undefined
  : _ExtendsObject<T> extends true
    ? K extends keyof T
      ? T[K] | undefined
      : never
    : undefined;

/**
 * Takes a value `T` and a key `K`.
 * If value is an `Array<A>` (`K` is enforced as number in this case), it returns `value[key]` as `A | undefined`.
 * If value is a non-array-object (`K` is enforced as `keyof T` in this case), it returns `value[key]` as `T[K] | undefined`.
 * Else it returns undefined.
 */
export const pick = <T, K extends _ToKeys<T>>(value: T | undefined, key: K): _PickReturn<T, K> => {
  if (Array.isArray(value)) {
    return value[key];
  }
  if (value !== null && typeof value === 'object') {
    return (<Record<K, unknown>>value)[key] as _PickReturn<T, K>;
  }
  return undefined as _PickReturn<T, K>;
};

const pickAOrB =
  <T, T2, P, P2>(vget: (v: T) => P | undefined, vget2: (v: T2) => P2 | undefined) =>
  (v: T | T2): P | P2 | undefined => {
    const p = vget(v as T);
    return p === undefined ? vget2(v as T2) : p;
  };

/**
 * An `UnionLens<T, P>` grants type-safe access on potential `P`, hence it can be used to
 * get `P | undefined` from an arbitrary `T`, where `T` might be a union of arbitrary types.
 *
 * From an `UnionLens<T, P>`, you can also retrieve a new `UnionLens<P, P[K]>`, where K is a potential key of P.
 * Use `getLens<T>()` to get an initial `UnionLens<T, T>`.
 *
 * You can see `UnionLens` as "universal optional chaining". While normal optional chaining only works on a `T | null | undefined`,
 * the `UnionLens` allows the type-safe access on arbitrary unions like A | B where A and B can have non-overlapping keys, or different
 * value types for overlapping keys.
 *
 * Furthermore, you can compose a `UnionLens<T, P>` with a `UnionLens<T2, P2>` to get a `UnionLens<T | T2, P | P2>`.
 *
 * E.g. given the following type and values:
 * ```ts
 * type TestChild = boolean | { x: number | Array<number> };
 * type Test =
 *   | number
 *   | {
 *       a: string | Array<boolean | TestChild>;
 *     };
 *
 *   const t1: Test = 42;
 *   const t2: Test = { a: 'Test3' };
 *   const t3: Test = { a: [true, { x: 7 }, { x: [1, 2, 3] }] };
 *   const t4: TestChild = { x: 7 };
 * ```
 *
 * you could get the following results with union-lenses:
 * ```ts
 * const lensA = getLens<Test>()('a');
 * const a1 = lensA.get(t1); // => undefined (inferred as undefined | string | Array<boolean | TestChild>)
 * const a2 = lensA.get(t2); // => 'Test3' (inferred as undefined | string | Array<boolean | TestChild>)
 * const a3 = lensA.get(t3); // => [true, { x: 7 }, { x: [1, 2, 3] }] (inferred as undefined | string | Array<boolean | TestChild>)
 *
 * const lensA2X1 = lensA(2)('x')(1);
 * const n1 = lensA2X1.get(t1); // => undefined (inferred as number | undefined)
 * const n2 = lensA2X1.get(t2); // => undefined (inferred as number | undefined)
 * const n3 = lensA2X1.get(t3); // => 2 (inferred as number | undefined)
 *
 * const lensB = getLens<Test>().compose(getLens<TestChild>());
 * const t3a = lensB('a').get(t3); // [true, { x: 7 }, { x: [1, 2, 3] }] (inferred as undefined | string | Array<boolean | TestChild>)
 * const t4x = lensB('x').get(t4); // 7 (inferred as undefined | number | Array<number>)
 * ```
 */
export type UnionLens<T, P> = {
  <K extends _ToKeys<P>>(key: K): UnionLens<T, _PickReturn<P, K>>;
  get: (value: T) => P | undefined;
  compose: <T2, P2>(lens: UnionLens<T2, P2>) => UnionLens<T | T2, P | P2>;
};

const unionLensKind = '$_UnionLens_$';
type KindedUnionLens<T, P> = UnionLens<T, P> & {
  kind: typeof unionLensKind;
};

/**
 * Typeguard to check, if the given value is an {@link UnionLens}
 */
export const isUnionLens = <T, P>(value: UnionLens<T, P> | unknown): value is UnionLens<T, P> =>
  !!value && typeof value === 'object' && 'kind' in value && value?.kind === unionLensKind;

const _toLens = <T, P>(get: (value: T) => P | undefined): KindedUnionLens<T, P> =>
  Object.assign(
    <K extends _ToKeys<P>>(key: K): KindedUnionLens<T, _PickReturn<P, K>> =>
      _toLens<T, _PickReturn<P, K>>((v: T): _PickReturn<P, K> => pick(get(v), key)),

    {
      kind: unionLensKind,
      get,
      compose: <T2, P2>(lens: UnionLens<T2, P2>): UnionLens<T | T2, P | P2> =>
        _toLens<T | T2, P | P2>(pickAOrB<T, T2, P, P2>(get, lens.get)),
    } as const,
  );

/**
 * Get an `UnionLens<T, T>` as starting point for type-safe access on arbitrarily nested
 * properties of type `T`, where `T` might be a union of arbitrary types.
 *
 * Given the following type and values:
 * ```ts
 * type TestChild = boolean | { x: number | Array<number> };
 * type Test =
 *   | number
 *   | {
 *       a: string | Array<boolean | TestChild>;
 *     };
 *
 *   const t1: Test = 42;
 *   const t2: Test = { a: 'Test3' };
 *   const t3: Test = { a: [true, { x: 7 }, { x: [1, 2, 3] }] };
 *   const t4: TestChild = { x: 7 };
 * ```
 *
 * you could get the following results with union-lenses:
 * ```ts
 * const lensA = getLens<Test>()('a');
 * const a1 = lensA.get(t1); // => undefined (inferred as undefined | string | Array<boolean | TestChild>)
 * const a2 = lensA.get(t2); // => 'Test3' (inferred as undefined | string | Array<boolean | TestChild>)
 * const a3 = lensA.get(t3); // => [true, { x: 7 }, { x: [1, 2, 3] }] (inferred as undefined | string | Array<boolean | TestChild>)
 *
 * const lensA2X1 = lensA(2)('x')(1);
 * const n1 = lensA2X1.get(t1); // => undefined (inferred as number | undefined)
 * const n2 = lensA2X1.get(t2); // => undefined (inferred as number | undefined)
 * const n3 = lensA2X1.get(t3); // => 2 (inferred as number | undefined)
 *
 * const lensB = getLens<Test>().compose(getLens<TestChild>());
 * const t3a = lensB('a').get(t3); // [true, { x: 7 }, { x: [1, 2, 3] }] (inferred as undefined | string | Array<boolean | TestChild>)
 * const t4x = lensB('x').get(t4); // 7 (inferred as undefined | number | Array<number>)
 * ```
 */
export const getLens = <T>(): UnionLens<T, T> => _toLens<T, T>((value: T) => value);
