import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getWeather, type FetchLike } from './client';

// One REAL integration test — a single live call to Open-Meteo. Kept separate
// from the fast suite (run with `npm run test:live`) because it is slow and
// needs the network. Its job is to catch the one thing fakes cannot: the real
// API changing shape. If Open-Meteo renamed a field, only this test would fail.
const realFetch: FetchLike = (url, init) => fetch(url, init);

test('fetches live weather from Open-Meteo', async () => {
  const r = await getWeather(19.07, 72.87, realFetch); // Mumbai
  assert.equal(r.ok, true, 'expected a successful live response');
  if (r.ok) {
    assert.equal(typeof r.value.temperatureC, 'number');
    assert.equal(typeof r.value.windSpeedKmh, 'number');
    assert.ok(
      ['clear', 'cloudy', 'fog', 'rain', 'snow', 'thunderstorm', 'unknown'].includes(
        r.value.condition,
      ),
    );
  }
});
