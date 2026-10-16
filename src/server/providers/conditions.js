// WMO weather interpretation codes → normalized condition + short description.
// https://open-meteo.com/en/docs (see "WMO Weather interpretation codes")
const CODES = {
  0: ['clear', 'Clear'],
  1: ['partly-cloudy', 'Mostly clear'],
  2: ['partly-cloudy', 'Partly cloudy'],
  3: ['cloudy', 'Cloudy'],
  45: ['fog', 'Fog'],
  48: ['fog', 'Freezing fog'],
  51: ['drizzle', 'Light drizzle'],
  53: ['drizzle', 'Drizzle'],
  55: ['drizzle', 'Dense drizzle'],
  56: ['drizzle', 'Freezing drizzle'],
  57: ['drizzle', 'Freezing drizzle'],
  61: ['rain', 'Light rain'],
  63: ['rain', 'Rain'],
  65: ['rain', 'Heavy rain'],
  66: ['rain', 'Freezing rain'],
  67: ['rain', 'Freezing rain'],
  71: ['snow', 'Light snow'],
  73: ['snow', 'Snow'],
  75: ['snow', 'Heavy snow'],
  77: ['snow', 'Snow grains'],
  80: ['rain', 'Light showers'],
  81: ['rain', 'Showers'],
  82: ['rain', 'Heavy showers'],
  85: ['snow', 'Snow showers'],
  86: ['snow', 'Heavy snow showers'],
  95: ['thunder', 'Thunderstorm'],
  96: ['thunder', 'Thunderstorm with hail'],
  99: ['thunder', 'Thunderstorm with hail'],
};

export function fromWmoCode(code) {
  const [condition, description] = CODES[code] ?? ['cloudy', 'Unknown'];
  return { condition, description };
}
