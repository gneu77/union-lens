/* eslint-disable @typescript-eslint/naming-convention */

import { _ToKeys } from './type-utils';
import { _PickReturn, pick } from './union-lens';

const _toGetter = <T>(g: () => T): UnionGetter<T> =>
  Object.assign(
    <K extends _ToKeys<T>>(key: K): UnionGetter<_PickReturn<T, K>> =>
      _toGetter(() => pick(g(), key)),
    {
      get: () => g(),
    },
  );

/**
 * Return type of the toGetter function.
 * Like `UnionLens`, a `Getter<T>` can be used for optional chaining on arbitrary union types.
 * In contrast to `UnionLens`, the initial `Getter<T>` must be obtained from a value of type `T`.
 * You can thus use it as kind of ad-hoc lens for a one-time access. In most cases however,
 * using an `UnionLens` is the preferred choice.
 *
 * See `toGetter` documentation for example usage.
 */
export type UnionGetter<T> = {
  <K extends _ToKeys<T>>(key: K): UnionGetter<_PickReturn<T, K>>;
  get: () => T;
};

/**
 * Wraps the given value of type T in a `UnionGetter<T>`.
 * A `UnionGetter<T>` can be used like a one-time ad-hoc version of an `UnionLens`.
 * In most cases however, using an `UnionLens` is the preferred choice.
 *
 * Given the following type and values:
 * ```ts
 * type Test =
 *   | number
 *   | {
 *       x: Array<number>;
 *       a: {
 *         b: number;
 *       };
 *   | {
 *       a: {
 *         b: string;
 *       }
 *     }
 * };
 *
 * let t1: Test = 42;
 * let t2: Test = { x: [1, 2, 3] };
 * let t3: Test = { a: { b: 'Test' } };
 * ```
 *
 * you could get the following results with toGetter:
 * ```ts
 * const b1 = toGetter(t1)('a')('b').get(); // => undefined (inferred as number | string | undefined)
 * const b2 = toGetter(t2)('a')('b').get(); // => undefined (inferred as number | string | undefined)
 * const b3 = toGetter(t3)('a')('b').get(); // => 'Test' (inferred as number | string | undefined)
 * const x1 = toGetter(t1)('x')(1).get();   // => undefined (inferred as number | undefined)
 * const x2 = toGetter(t2)('x')(1).get();   // => 2 (inferred as number | undefined)
 * const x3 = toGetter(t3)('x')(1).get();   // => undefined (inferred as number | undefined)
 * ```
 */
export const toGetter = <T>(value: T): UnionGetter<T> => _toGetter<T>(() => value);
