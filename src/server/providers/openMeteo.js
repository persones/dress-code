import { fromWmoCode } from './conditions.js';

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

export async function getForecast({ lat, lon, timezone, units }) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    timezone,
    temperature_unit: units,
    current: 'temperature_2m,weather_code',
    hourly: 'temperature_2m,precipitation_probability,weather_code',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code',
    forecast_days: 3,
  });

  const res = await fetch(`${BASE_URL}?${params}`, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}: ${await res.text()}`);
  const { current, hourly, daily } = await res.json();

  return {
    current: {
      temp: Math.round(current.temperature_2m),
      ...fromWmoCode(current.weather_code),
    },
    hourly: hourly.time.map((time, i) => ({
      time,
      temp: Math.round(hourly.temperature_2m[i]),
      rainChance: hourly.precipitation_probability[i] ?? 0,
      condition: fromWmoCode(hourly.weather_code[i]).condition,
    })),
    daily: daily.time.map((date, i) => ({
      date,
      maxTemp: Math.round(daily.temperature_2m_max[i]),
      minTemp: Math.round(daily.temperature_2m_min[i]),
      rainChance: daily.precipitation_probability_max[i] ?? 0,
      ...fromWmoCode(daily.weather_code[i]),
    })),
  };
}
