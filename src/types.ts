// The domain types — designed before any logic (the capstone-design lesson).
// In a typed language the types ARE the design: get these right and the
// implementation falls out, because the compiler rejects everything that
// does not fit.

// A closed set of conditions, so a caller can switch exhaustively and no one
// can pass "drizzling" where a Condition is expected. `unknown` is honest:
// unrecognised WMO codes map to it rather than a lie or a crash.
export type Condition =
  | 'clear'
  | 'cloudy'
  | 'fog'
  | 'rain'
  | 'snow'
  | 'thunderstorm'
  | 'unknown';

// The clean, trustworthy value a caller gets back. readonly (a snapshot),
// unit-named (temperatureC, not temperature), never a raw weather_code.
export interface Weather {
  readonly temperatureC: number;
  readonly windSpeedKmh: number;
  readonly condition: Condition;
}

// Every failure is modelled as its own variant, carrying exactly its own data
// (a network error has no status). A discriminated union, so callers handle
// each exhaustively — and the compiler forces a new kind to be handled.
export type WeatherError =
  | { kind: 'network' } // never reached the server
  | { kind: 'http'; status: number } // server responded, but with an error status
  | { kind: 'badShape'; detail: string } // response arrived, but not in a shape we trust
  | { kind: 'timeout'; ms: number } // the request took too long
  | { kind: 'badInput'; detail: string }; // the caller passed invalid coordinates

// A failure is a value, not a thrown exception a caller might forget to catch.
// You cannot read `value` without first checking `ok`, and the failure is in
// the return type so it cannot be silently ignored.
export type Result<T, E = WeatherError> = { ok: true; value: T } | { ok: false; error: E };

// The subset of the Open-Meteo response we read. NOT our domain type — this is
// the untrusted incoming shape, validated before we believe it. Kept separate
// from Weather so an API rename touches only this and the mapping.
export interface ApiResponse {
  current: {
    temperature_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
}
