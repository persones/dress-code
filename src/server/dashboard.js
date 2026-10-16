// Date + hour "now" in the configured timezone, e.g. { date: '2026-10-16', hour: 17 }.
function nowIn(timeZone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
}

function addDays(date, days) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function matchesRules(item, maxTemp, rainChance) {
  const hasRule = item.minTemp != null || item.maxTemp != null || item.minRainChance != null;
  if (!hasRule) {
    console.warn(`Clothing item "${item.name}" has no rules and is ignored`);
    return false;
  }
  if (item.minTemp != null && !(maxTemp >= item.minTemp)) return false;
  if (item.maxTemp != null && !(maxTemp <= item.maxTemp)) return false;
  if (item.minRainChance != null && !(rainChance >= item.minRainChance)) return false;
  return true;
}

export function buildDashboard(config, snapshot) {
  const { startHour, endHour } = config.day;
  const now = nowIn(config.timezone);
  const isTomorrow = now.hour >= endHour;
  const targetDate = isTomorrow ? addDays(now.date, 1) : now.date;

  const homeDay = snapshot.home.daily.find((d) => d.date === targetDate) ?? {};
  const officeDay = snapshot.office?.daily.find((d) => d.date === targetDate) ?? {};

  const hourly = snapshot.home.hourly
    .filter((h) => h.time.slice(0, 10) === targetDate)
    .map((h) => ({ ...h, hour: Number(h.time.slice(11, 13)) }))
    .filter((h) => h.hour >= startHour && h.hour <= endHour)
    .map(({ hour, temp, rainChance, condition }) => ({ hour, temp, rainChance, condition }));

  const maxAgeMs = 2 * config.forecastRefreshMinutes * 60_000;
  const stale = !snapshot.fetchedAt || Date.now() - snapshot.fetchedAt.getTime() > maxAgeMs;

  return {
    generatedAt: new Date().toISOString(),
    fetchedAt: snapshot.fetchedAt?.toISOString() ?? null,
    stale,
    targetDate,
    isTomorrow,
    units: config.units === 'celsius' ? 'C' : 'F',
    clientRefreshMinutes: config.clientRefreshMinutes,
    home: {
      label: config.locations.home.label,
      current: snapshot.home.current,
      maxTemp: homeDay.maxTemp ?? null,
      rainChance: homeDay.rainChance ?? null,
      condition: homeDay.condition ?? null,
      description: homeDay.description ?? null,
      hourly,
    },
    office: {
      label: config.locations.office.label,
      maxTemp: officeDay.maxTemp ?? null,
      rainChance: officeDay.rainChance ?? null,
    },
    clothes: config.clothes
      .filter((item) => matchesRules(item, homeDay.maxTemp, homeDay.rainChance))
      .map((item) => ({ name: item.name, image: `/assets/clothes/${item.image}` })),
  };
}
