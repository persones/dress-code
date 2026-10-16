import fs from 'node:fs';
import path from 'node:path';
import { load } from 'js-yaml';

export const ROOT = path.resolve(import.meta.dirname, '../..');
const CONFIG_PATH = process.env.CONFIG_PATH || path.join(ROOT, 'config.yaml');

let lastGood = null;

function validate(cfg) {
  const errors = [];
  for (const key of ['home', 'office']) {
    const loc = cfg?.locations?.[key];
    if (!loc) errors.push(`locations.${key} is missing`);
    else if (typeof loc.lat !== 'number' || typeof loc.lon !== 'number') {
      errors.push(`locations.${key} needs numeric lat and lon`);
    }
  }
  if (!Array.isArray(cfg?.clothes)) errors.push('clothes must be a list');
  if (errors.length) throw new Error(`Invalid ${CONFIG_PATH}: ${errors.join('; ')}`);

  return {
    provider: 'open-meteo',
    units: 'fahrenheit',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    forecastRefreshMinutes: 60,
    clientRefreshMinutes: 5,
    ...cfg,
    day: { startHour: 8, endHour: 17, ...cfg.day },
  };
}

// Reads and validates config.yaml; throws on any problem.
export function loadConfig() {
  lastGood = validate(load(fs.readFileSync(CONFIG_PATH, 'utf8')));
  return lastGood;
}

// Like loadConfig, but falls back to the last good config so a half-edited
// file doesn't blank the screen.
export function getConfig() {
  try {
    return loadConfig();
  } catch (err) {
    if (!lastGood) throw err;
    console.error(`Config error, using last good config: ${err.message}`);
    return lastGood;
  }
}
