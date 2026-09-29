import { getWeather, type FetchLike } from './client';
import { describe } from './describe';

// The global fetch structurally satisfies FetchLike (a Response has ok, status
// and json(): Promise<any>, assignable to Promise<unknown>). A tiny adapter
// keeps the types explicit.
const realFetch: FetchLike = (url, init) => fetch(url, init);

// A small demo: fetch the weather for a couple of cities and print each result.
// Run with `npm start`.
async function main(): Promise<void> {
  const places: ReadonlyArray<readonly [name: string, lat: number, lon: number]> = [
    ['Mumbai', 19.07, 72.87],
    ['Pune', 18.52, 73.86],
  ];

  for (const [name, lat, lon] of places) {
    const result = await getWeather(lat, lon, realFetch);
    console.log(`${name}: ${describe(result)}`);
  }
}

main().catch((err: unknown) => {
  console.error('Unexpected error:', err);
  process.exitCode = 1;
});
