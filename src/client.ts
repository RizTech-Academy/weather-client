import type { ApiResponse, Condition, Result, Weather, WeatherError } from './types';

// The slice of fetch's contract we actually use — small on purpose, so it is
// easy to fake in tests and states exactly what the function depends on.
// json() returns Promise<unknown>, not any — the honest type for unchecked data.
export type FetchLike = (
  url: string,
  init?: { signal?: AbortSignal },
) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

// Build the request URL. Both parameters are `number`, so a caller cannot pass
// a string where a coordinate belongs.
export function buildUrl(latitude: number, longitude: number): string {
  return (
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}` +
    `&longitude=${longitude}&current=temperature_2m,wind_speed_10m,weather_code`
  );
}

// Prove that untrusted `unknown` really is an ApiResponse before we read it.
// The `value is ApiResponse` predicate narrows `unknown` at the call site.
export function isApiResponse(value: unknown): value is ApiResponse {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  const c = v.current;
  if (typeof c !== 'object' || c === null) return false;
  const cur = c as Record<string, unknown>;
  return (
    typeof cur.temperature_2m === 'number' &&
    typeof cur.wind_speed_10m === 'number' &&
    typeof cur.weather_code === 'number'
  );
}

// Map the opaque WMO code to a Condition. The return type enforces the closed
// set, and the final `unknown` makes the function total — defined for every
// number, with no gap for a crash to slip through.
export function toCondition(code: number): Condition {
  if (code === 0) return 'clear';
  if (code >= 1 && code <= 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'snow';
  if (code >= 95 && code <= 99) return 'thunderstorm';
  return 'unknown';
}

// Untrusted input comes from callers too. Reject out-of-range coordinates with
// a typed error rather than sending garbage to the API.
export function validateCoords(lat: number, lon: number): WeatherError | null {
  if (Number.isNaN(lat) || lat < -90 || lat > 90) {
    return { kind: 'badInput', detail: `latitude ${lat}` };
  }
  if (Number.isNaN(lon) || lon < -180 || lon > 180) {
    return { kind: 'badInput', detail: `longitude ${lon}` };
  }
  return null; // valid
}

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}

// The client, whose signature the design fixed:
//   (latitude, longitude, fetchFn) => Promise<Result<Weather>>
// Every failure is a typed Result; nothing throws a surprise.
export async function getWeather(
  latitude: number,
  longitude: number,
  fetchFn: FetchLike,
  timeoutMs = 5000,
): Promise<Result<Weather>> {
  const bad = validateCoords(latitude, longitude);
  if (bad) return { ok: false, error: bad };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Awaited<ReturnType<FetchLike>>;
  try {
    res = await fetchFn(buildUrl(latitude, longitude), { signal: controller.signal });
  } catch (err) {
    // An abort surfaces as a rejected promise; distinguish it from a plain
    // network failure by the error's name.
    if (isAbortError(err)) return { ok: false, error: { kind: 'timeout', ms: timeoutMs } };
    return { ok: false, error: { kind: 'network' } };
  } finally {
    clearTimeout(timer); // always clear the timer, on every path
  }

  if (!res.ok) {
    return { ok: false, error: { kind: 'http', status: res.status } };
  }

  const body: unknown = await res.json(); // untrusted
  if (!isApiResponse(body)) {
    return { ok: false, error: { kind: 'badShape', detail: 'missing current fields' } };
  }

  return {
    ok: true,
    value: {
      temperatureC: body.current.temperature_2m, // safe — body narrowed to ApiResponse
      windSpeedKmh: body.current.wind_speed_10m,
      condition: toCondition(body.current.weather_code),
    },
  };
}
