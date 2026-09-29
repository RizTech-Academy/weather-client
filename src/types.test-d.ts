// Type-level tests: assertions about the TYPES, checked by `tsc --noEmit` (they
// are never executed). A refactor can break a type guarantee while every
// runtime test still passes — these catch that.
import type { Condition, Result, Weather } from './types';
import { getWeather, toCondition } from './client';

// `Equal<A, B>` is `true` only when A and B are the exact same type;
// `Expect<T>` compiles only when T is `true`.
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

// These hold, so they compile silently.
export type _1 = Expect<Equal<ReturnType<typeof toCondition>, Condition>>; // toCondition returns exactly Condition
export type _2 = Expect<Equal<Weather['temperatureC'], number>>; // the field is a number
export type _3 = Expect<Equal<Awaited<ReturnType<typeof getWeather>>, Result<Weather>>>; // getWeather returns Result<Weather>

// `condition` is a closed union, NOT plain string — so this assertion is FALSE,
// and @ts-expect-error consumes the resulting error. If someone loosened
// `condition` to `string`, this line would have nothing to suppress and would
// itself become an error.
// @ts-expect-error condition is a closed union, not string
export type _4 = Expect<Equal<Weather['condition'], string>>;
