# _union-lens_

**Lenses to provide type-safe optional chaining on union types**


## Installation

**`npm install --save union-lens`**

## Dependencies

**none**

## License

[MIT](https://choosealicense.com/licenses/mit/)

## What is it?

In short, one might say this lib provides optional chaining on arbitrary union types.

The problem with usual optional chaining like `value?.a` is that it only works, if the type of value is a union with null and/or undefined, like e.g. `{ a: string } | null | undefined`.

However, if you try optional chaining on arbitrary union types like `{ a: number } | { b: string }`, you will get a Typescript error for `value?.a`.

To solve this, you would have to check for `'a' in value` in advance and if your union contains also non-object types you also have to check for `typeof value === 'object'`. Things start getting nasty, once you have unions of many different types and in addition these types might also be objects with nested properties that are union types of their own. A simple check if a certain property is there or not might end up in a huge amount of boilerplate code to satisfy Typescript.
Some people might just use some nasty casting like `(value as any)?.a`, however this means sacrificing type-safety (e.g. you will get no compiler error, if someone changes the property name from `a` to `b`) and also the return type will be of type any instead of the concrete types.

This library provides two utility types to achieve both, full type-safety (including full IDE autocompletion for property access and correct type inference for the return value) and an acceptable amount of additional code at the same time.

### The first utility type is `UnionLens<T, P>`

E.g. given the following type and values:
```typescript
type Test =
  | number
  | {
      a: string | Array<boolean | TestChild>;
    };

const t1: Test = 42;
const t2: Test = { a: 'Test3' };
const t3: Test = { a: [true, { x: 7 }, { x: [1, 2, 3] }] };
const t4: TestChild = { x: 7 };
```
you could get the following results with union-lenses:
```typescript
const lensA = getLens<Test>()('a');
const a1 = lensA.get(t1); // => undefined (inferred as undefined | string | Array<boolean | TestChild>)
const a2 = lensA.get(t2); // => 'Test3' (inferred as undefined | string | Array<boolean | TestChild>)
const a3 = lensA.get(t3); // => [true, { x: 7 }, { x: [1, 2, 3] }] (inferred as undefined | string | Array<boolean | TestChild>)

const lensA2X1 = lensA(2)('x')(1);
const n1 = lensA2X1.get(t1); // => undefined (inferred as number | undefined)
const n2 = lensA2X1.get(t2); // => undefined (inferred as number | undefined)
const n3 = lensA2X1.get(t3); // => 2 (inferred as number | undefined)
```

It is also possible to compose a `UnionLens<T, P>` with a `UnionLens<T2, P2>` to get a `UnionLens<T | T2, P | P2>`
```typescript
const lensB = getLens<Test>().compose(getLens<TestChild>());
const t3a = lensB('a').get(t3); // [true, { x: 7 }, { x: [1, 2, 3] }] (inferred as undefined | string | Array<boolean | TestChild>)
const t4x = lensB('x').get(t4); // 7 (inferred as undefined | number | Array<number>)
```

### The second utility type is `UnionGetter<T>`

A `UnionGetter<T>` can be used like a one-time ad-hoc version of an `UnionLens`.

E.g. given the following type and values:
```typescript
type Test =
  | number
  | {
      x: Array<number>;
      a: {
        b: number;
      };
  | {
      a: {
        b: string;
      }
    }
};

let t1: Test = 42;
let t2: Test = { x: [1, 2, 3] };
let t3: Test = { a: { b: 'Test' } };
```
you could get the following results with toGetter:
```typescript
const b1 = toGetter(t1)('a')('b').get(); // => undefined (inferred as number | string | undefined)
const b2 = toGetter(t2)('a')('b').get(); // => undefined (inferred as number | string | undefined)
const b3 = toGetter(t3)('a')('b').get(); // => 'Test' (inferred as number | string | undefined)
const x1 = toGetter(t1)('x')(1).get();   // => undefined (inferred as number | undefined)
const x2 = toGetter(t2)('x')(1).get();   // => 2 (inferred as number | undefined)
const x3 = toGetter(t3)('x')(1).get();   // => undefined (inferred as number | undefined)
```
