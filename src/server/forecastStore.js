import { getProvider } from './providers/index.js';

const LOCATIONS = ['home', 'office'];

// fetchedAt is only set when every location refreshed successfully.
let snapshot = { fetchedAt: null, home: null, office: null };

export async function refresh(config) {
  const provider = getProvider(config.provider);
  const results = await Promise.allSettled(
    LOCATIONS.map((key) =>
      provider.getForecast({
        ...config.locations[key],
        timezone: config.timezone,
        units: config.units,
      }),
    ),
  );

  const next = { ...snapshot };
  let allOk = true;
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') next[LOCATIONS[i]] = result.value;
    else {
      allOk = false;
      console.error(`Forecast refresh failed for ${LOCATIONS[i]}: ${result.reason.message}`);
    }
  });
  if (allOk) next.fetchedAt = new Date();
  snapshot = next;
  console.log(`Forecast refreshed at ${new Date().toISOString()}${allOk ? '' : ' (with errors)'}`);
}

export function start(getConfig) {
  const tick = () => refresh(getConfig()).catch((err) => console.error(`Forecast refresh failed: ${err.message}`));
  tick();
  setInterval(tick, getConfig().forecastRefreshMinutes * 60_000);
}

export function getSnapshot() {
  return snapshot;
}
