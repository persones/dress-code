import * as openMeteo from './openMeteo.js';

// To add a provider: write a module exporting getForecast() with the same
// return shape as openMeteo.js and register it here.
const providers = {
  'open-meteo': openMeteo,
};

export function getProvider(name) {
  const provider = providers[name];
  if (!provider) throw new Error(`Unknown weather provider "${name}"`);
  return provider;
}
