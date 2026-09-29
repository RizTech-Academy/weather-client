import type { Result, Weather } from './types';

// Turn a Result into a message. Because both success and every failure are
// typed, each is handled precisely — and the `never` default makes a forgotten
// case a COMPILE error, not a silent fall-through.
export function describe(result: Result<Weather>): string {
  if (result.ok) {
    const w = result.value;
    return `${w.temperatureC}°C, wind ${w.windSpeedKmh} km/h, ${w.condition}`;
  }
  const e = result.error;
  switch (e.kind) {
    case 'network':
      return 'Could not reach the weather service.';
    case 'http':
      return `Weather service error (HTTP ${e.status}).`;
    case 'badShape':
      return `Unexpected response: ${e.detail}.`;
    case 'timeout':
      return `Weather service timed out after ${e.ms} ms.`;
    case 'badInput':
      return `Invalid request: ${e.detail}.`;
    default: {
      // If every kind above is handled, `e` narrows to `never` here and this
      // compiles. Add a new WeatherError kind without a case, and `e` is no
      // longer `never` — the build fails (TS2322), forcing you to handle it.
      const _exhaustive: never = e;
      return _exhaustive;
    }
  }
}
