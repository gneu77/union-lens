/* eslint-disable @typescript-eslint/naming-convention */

/**
 * Returns true, if `T` extends any concrete object literal type.
 */
export type _ExtendsObject<T> = T extends object & { [K in keyof T]: unknown } ? true : false;

/**
 * Returns number in case `T` is an `Array`,
 * else if `T` is a non-array-object, it returns the keys of it,
 * else it returns never.
 */
export type _ToKeys<T> = T extends unknown[]
  ? number
  : _ExtendsObject<T> extends true
    ? {
        [K in keyof T]: K;
      }[keyof T]
    : never;
