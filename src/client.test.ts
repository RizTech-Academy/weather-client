import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getWeather, toCondition, validateCoords, type FetchLike } from './client';

// A fake for each scenario — each satisfies FetchLike, so getWeather accepts it
// exactly as it accepts the real fetch. This is the payoff of injecting fetch:
// we drive every branch deterministically, with no live network.
const fakeOk: FetchLike = async () => ({
  ok: true,
  status: 200,
  json: async () => ({ current: { temperature_2m: 27, wind_speed_10m: 5, weather_code: 61 } }),
});

const fakeHttp: FetchLike = async () => ({ ok: false, status: 503, json: async () => ({}) });

const fakeBadShape: FetchLike = async () => ({
  ok: true,
  status: 200,
  json: async () => ({ current: { temperature_2m: 'hot' } }), // wrong type — should be rejected
});

const fakeNetwork: FetchLike = async () => {
  throw new TypeError('fetch failed'); // never reached the server
};

// Respects the abort signal: rejects with an AbortError when the timeout fires.
const fakeSlow: FetchLike = (_url, init) =>
  new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => {
      const err = new Error('aborted');
      err.name = 'AbortError';
      reject(err);
    });
  });

test('maps a successful response to Weather', async () => {
  const r = await getWeather(19, 72, fakeOk);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.value.temperatureC, 27);
    assert.equal(r.value.windSpeedKmh, 5);
    assert.equal(r.value.condition, 'rain'); // weather_code 61 -> rain
  }
});

test('an error status becomes an http failure', async () => {
  const r = await getWeather(0, 0, fakeHttp);
  assert.equal(r.ok, false);
  if (!r.ok) assert.deepEqual(r.error, { kind: 'http', status: 503 });
});

test('a malformed body becomes a badShape failure', async () => {
  const r = await getWeather(0, 0, fakeBadShape);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.error.kind, 'badShape');
});

test('a thrown fetch becomes a network failure', async () => {
  const r = await getWeather(0, 0, fakeNetwork);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.error.kind, 'network');
});

test('a hanging request becomes a timeout failure', async () => {
  const r = await getWeather(0, 0, fakeSlow, 20); // 20ms timeout
  assert.equal(r.ok, false);
  if (!r.ok) assert.deepEqual(r.error, { kind: 'timeout', ms: 20 });
});

test('out-of-range coordinates are rejected before any fetch', async () => {
  let called = false;
  const spy: FetchLike = async () => {
    called = true;
    return { ok: true, status: 200, json: async () => ({}) };
  };
  const r = await getWeather(200, 0, spy);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.error.kind, 'badInput');
  assert.equal(called, false); // no network call for bad input
});

test('toCondition maps WMO codes and is total', () => {
  assert.equal(toCondition(0), 'clear');
  assert.equal(toCondition(2), 'cloudy');
  assert.equal(toCondition(45), 'fog');
  assert.equal(toCondition(61), 'rain');
  assert.equal(toCondition(71), 'snow');
  assert.equal(toCondition(95), 'thunderstorm');
  assert.equal(toCondition(999), 'unknown'); // the total-function guarantee, checked
});

test('validateCoords accepts valid and rejects invalid', () => {
  assert.equal(validateCoords(19, 72), null);
  assert.equal(validateCoords(-90, 180), null);
  assert.notEqual(validateCoords(91, 0), null);
  assert.notEqual(validateCoords(0, 181), null);
  assert.notEqual(validateCoords(Number.NaN, 0), null);
});
