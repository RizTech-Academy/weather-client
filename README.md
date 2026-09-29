# weather-client

**The reference project for the [RizTech Academy](https://www.riztechacademy.com/learn) TypeScript Foundation
capstone.**

A small, fully-typed library with one job: given a latitude and longitude, return the current weather as a
clean, trustworthy value — and handle every way that can go wrong without ever crashing.

```ts
getWeather(19.07, 72.87, fetch); // Mumbai
// → { ok: true,  value: { temperatureC: 27.7, windSpeedKmh: 5.2, condition: "clear" } }
// → { ok: false, error: { kind: "http", status: 503 } }
```

It calls a **live public API** (Open-Meteo — free, no key), turns an **untrusted JSON response** into a
fully-typed value, and models **every failure** as a typed `Result` rather than a thrown exception. It is the
kind of typed boundary that sits at the edge of every professional codebase — and it exercises the whole
course: literal unions, `readonly`, discriminated unions and narrowing, generics, `unknown` and type guards,
async, dependency injection, and type-level tests.

## Run it

```bash
npm install
npm run typecheck   # tsc --noEmit — including the type-level tests
npm test            # the runtime test suite (no network — uses fake responses)
npm start           # a live demo: prints the weather for Mumbai and Pune
npm run test:live   # one real integration test against Open-Meteo (needs network)
```

## What's inside

| File | What it is |
|------|-----------|
| `src/types.ts` | The domain: `Condition`, `Weather`, `WeatherError`, `Result<T,E>`, `ApiResponse`. The design — types before logic. |
| `src/client.ts` | `getWeather` and its helpers: `buildUrl`, `isApiResponse` (the boundary guard), `toCondition` (WMO → condition), `validateCoords`, and the injected `FetchLike`. |
| `src/describe.ts` | Consuming a `Result` exhaustively — with the `never` guard that makes a forgotten failure a compile error. |
| `src/client.test.ts` | Runtime tests: the happy path and **every** failure (http, badShape, network, timeout, badInput), driven by fake `fetch`es. |
| `src/types.test-d.ts` | **Type-level tests** — assertions about the types themselves, checked by `tsc`. |
| `src/live.test.ts` | One real Open-Meteo call, kept separate — the only thing fakes cannot check (the API changing shape). |
| `src/index.ts` | A runnable demo. |

## The five requirements it is built to

1. **The public value is fully typed and trustworthy** — a `Weather` with a numeric temperature and wind speed
   and a `condition` from a closed set, never a raw code or `any`.
2. **The boundary is validated, not asserted** — the JSON arrives as `unknown` and is *checked* before it is
   believed (no `as ApiResponse`).
3. **Every failure is modelled** — network, http, badShape, timeout and badInput are distinct, typed outcomes,
   returned as a `Result` value, not thrown.
4. **Illegal states are unrepresentable** — you cannot build a `Weather` with an unknown `condition`, or read
   `value` on a failed result.
5. **It is testable without the network** — `fetch` is injected, so every path is exercised against fakes.

## A note for learners

This is the finished capstone — build it yourself by working through the five capstone lessons, and compare
with this repo when you get stuck. Every file maps to a step in the course, and every choice is one the
best-practices and real-projects modules argued for.
