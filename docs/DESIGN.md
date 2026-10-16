# Dress Code — Design Document

## 1. Overview

Dress Code is a single web page shown on a 10" screen at home. It helps the kids choose clothes for the day based on the weather at home (where the school is), and shows the parent the forecast for their downtown office.

### What's on the page

**Kids (home / school)**
- Current temperature
- Max temperature for the day
- Chance of rain
- Short weather description (e.g. "Partly cloudy")
- Graph of temperature and rain chance from 8am to 5pm, with a condition icon for each hour
- Clothing suggestions, each shown as an SVG picture

**Office (downtown)**
- Max temperature for the day
- Max chance of rain

### Which day is shown
Before 5pm the page shows **today**. From 5pm onward it shows **tomorrow**, so the kids can plan the evening before.

### Goals
- One screen, landscape (~1280×800), readable from across the room, with no interaction needed.
- A lean codebase that's easy to tweak by editing a single YAML file.
- A swappable weather provider, starting with Open-Meteo.

### Non-goals
- Unit tests, authentication, a database, multiple users.

### Language
**JavaScript only, no TypeScript anywhere.** The server uses plain `.js` ES modules, Vue components use `<script setup>` in JS, and the Vite config is `vite.config.js`. There are no `.ts` files, no `tsconfig`, and no type-check step.

---

## 2. Architecture

```
 Browser (Vue 3, 10" screen)
        │  every 5 min: GET /api/dashboard        (+ static files, SVG assets)
        ▼
 Node server (Express)
   ├── dashboard.js ── reads ──▶ config.yaml          (re-read per request)
   │        │
   │        └── reads ──▶ forecastStore (in-memory snapshot)
   │                              ▲
   │                              │ every 60 min: getForecast(home), getForecast(office)
   └──────────────────────────────┴──▶ Weather provider (Open-Meteo)
```

- **The server holds all the logic**: which day to show, slicing the 8am–5pm window, clothing selection, and mapping weather codes to descriptions. The client only renders.
- **The server refreshes the forecast every hour.** At startup, and then every `forecastRefreshMinutes` (default 60, via `setInterval`), it fetches both locations from the provider and stores the result in memory.
  - `/api/dashboard` never calls the weather API. It only reads the stored snapshot.
  - If a refresh fails, the server logs it, keeps the previous snapshot, and tries again on the next tick.
  - Each snapshot records `fetchedAt`. The response is marked `stale: true` when the snapshot is older than 2× the refresh interval.
- **`config.yaml` is re-read on every request**, so changes to clothes, thresholds or labels apply without a restart. Changing the locations or the provider takes effect at the next hourly refresh, or immediately on restart.
- **Why a server at all?** Open-Meteo could be called directly from the browser, but the server gives us:
  - one hourly fetch shared by any number of screens
  - a place to keep API keys if we switch to a provider that needs one
  - an editable config with no rebuild
  - a single port that serves everything

---

## 3. Folder structure

```
dress-code/
  package.json              # single package; scripts: dev:server, dev:client, build, start
  config.yaml               # locations, schedule, clothes
  assets/
    clothes/*.svg           # clothing pictures, referenced by config.yaml `image`
    weather/*.svg           # one icon per normalized condition (clear.svg, rain.svg, …)
  docs/
    DESIGN.md
  src/
    server/
      index.js              # Express app: routes, static serving, starts the refresh loop
      config.js             # load + validate config.yaml (js-yaml)
      forecastStore.js      # hourly refresh loop + in-memory snapshot per location
      dashboard.js          # builds the API response: day selection, window slice, clothes
      providers/
        index.js            # getProvider(name) → provider module
        openMeteo.js        # Open-Meteo implementation of the provider interface
        conditions.js       # WMO weather code → { condition, description }
    client/
      index.html
      vite.config.js        # root = src/client, outDir = dist/client, proxy /api → :3000
      main.js
      App.vue               # fetch + auto-refresh, page layout
      components/
        KidsPanel.vue       # headline numbers, description, chart, clothes
        HourlyChart.vue     # hand-rolled SVG chart
        ClothesList.vue     # clothing tiles
        OfficePanel.vue     # office max temp + rain
```

**Dependencies**
- Runtime: `express`, `js-yaml`, `vue`
- Dev: `vite`, `@vitejs/plugin-vue`

There are no other dependencies. The project uses Node 18+ for the built-in `fetch`.

---

## 4. Configuration (`config.yaml`)

```yaml
provider: open-meteo
units: fahrenheit             # fahrenheit | celsius, passed to the provider
timezone: America/Los_Angeles # used for "today/tomorrow" and hourly times

forecastRefreshMinutes: 60    # server → weather API
clientRefreshMinutes: 5       # page → server (cheap; also catches the 5pm switch-over)

day:
  startHour: 8                # first hour on the graph
  endHour: 17                 # last hour on the graph; also the switch-over to "tomorrow"

locations:
  home:
    label: Home / School
    zip: "94110"
    lat: 37.75
    lon: -122.41
  office:
    label: Downtown
    zip: "94105"
    lat: 37.79
    lon: -122.39

clothes:
  - name: winter coat
    maxTemp: 45
    image: winter_coat.svg
  - name: sweater
    minTemp: 46
    maxTemp: 56
    image: sweater.svg
  - name: light jacket
    minTemp: 57
    maxTemp: 60
    image: light_jacket.svg
  - name: t-shirt
    minTemp: 61
    image: tshirt.svg
  - name: shorts
    minTemp: 75
    image: shorts.svg
  - name: raincoat
    minRainChance: 40         # rain-only item, no temperature bounds
    image: raincoat.svg
  - name: umbrella
    minRainChance: 60
    image: umbrella.svg
```

### Locations
- Each location has `lat`/`lon` (Open-Meteo needs these) and an optional `zip`. The zip is for reference, and for any future provider that takes zip codes.

### Clothing rules
An item is shown when **all** of the conditions it specifies hold:

| Field           | Condition                          | If omitted  |
|-----------------|------------------------------------|-------------|
| `minTemp`       | `dayMaxTemp >= minTemp`            | no lower bound |
| `maxTemp`       | `dayMaxTemp <= maxTemp`            | no upper bound |
| `minRainChance` | `dayRainChance >= minRainChance`   | rain is ignored |

- `dayMaxTemp` and `dayRainChance` are the home location's values for the target day.
- Bounds are inclusive. Temperatures use the configured units.
- An item with none of these fields is ignored, and the server logs a warning.
- Matching items are shown in YAML order. Several items can match at once (e.g. t-shirt + raincoat).
- `image` is a filename in `assets/clothes/`.

### Validation (`config.js`)
- At startup, the server fails fast with a clear message if any of these is missing: `locations.home`, `locations.office`, their `lat`/`lon`, or `clothes`.
- On a re-read during a request, a broken file is logged and the last good config is used, so the screen doesn't go blank while the file is being edited.

---

## 5. Weather provider interface

Every provider is a module exporting one function:

```js
// src/server/providers/<name>.js
export async function getForecast({ lat, lon, zip, timezone, units }) {
  return {
    current: { temp, condition, description },
    hourly:  [{ time /* "2026-10-16T08:00", local */, temp, rainChance, condition }],
    daily:   [{ date /* "2026-10-16" */, maxTemp, minTemp, rainChance, condition, description }],
  };
}
```

- `rainChance` is 0–100.
- `hourly` and `daily` must cover at least today and tomorrow (Open-Meteo is asked for 3 days so tomorrow is still covered if a refresh around midnight fails).
- `condition` is a normalized value that the client uses for icons, independent of the provider:
  `clear | partly-cloudy | cloudy | fog | drizzle | rain | snow | thunder`
  Each has a matching `assets/weather/<condition>.svg`.
- `providers/index.js` maps a name to a module:
  ```js
  import * as openMeteo from './openMeteo.js';
  const providers = { 'open-meteo': openMeteo };
  export function getProvider(name) { /* throw if unknown */ }
  ```
- **Adding a provider** means writing a new module with the same `getForecast` shape and adding one line to the map. API keys come from environment variables (e.g. `OPENWEATHER_API_KEY`) and never reach the client.

### Open-Meteo implementation
Request (no API key needed):

```
GET https://api.open-meteo.com/v1/forecast
  ?latitude=<lat>&longitude=<lon>
  &timezone=<timezone>
  &temperature_unit=<fahrenheit|celsius>
  &current=temperature_2m,weather_code
  &hourly=temperature_2m,precipitation_probability,weather_code
  &daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code
  &forecast_days=3
```

- Open-Meteo returns parallel arrays (`hourly.time[]`, `hourly.temperature_2m[]`, …). `openMeteo.js` zips them into the object arrays above.
- Open-Meteo has no text description, only a WMO `weather_code`. `conditions.js` maps the codes:

| WMO codes        | condition       | description (examples)          |
|------------------|-----------------|---------------------------------|
| 0                | clear           | Clear                           |
| 1, 2             | partly-cloudy   | Mostly clear / Partly cloudy    |
| 3                | cloudy          | Cloudy                          |
| 45, 48           | fog             | Fog                             |
| 51–57            | drizzle         | Light / dense drizzle           |
| 61–67, 80–82     | rain            | Light / moderate / heavy rain, showers |
| 71–77, 85, 86    | snow            | Snow, snow showers              |
| 95–99            | thunder         | Thunderstorm                    |

---

## 6. Forecast store (`forecastStore.js`)

```js
// state
let snapshot = { fetchedAt: null, home: null, office: null };

export async function refresh(config) { /* fetch both locations in parallel; on success replace snapshot */ }
export function start(getConfig) { refresh(getConfig()); setInterval(() => refresh(getConfig()), minutes * 60_000); }
export function getSnapshot() { return snapshot; }
```

- Both locations are fetched in parallel. If one fails, the server keeps the previous value for that location and logs the error.
- The interval comes from `forecastRefreshMinutes` at startup.

---

## 7. Day-selection logic (`dashboard.js`)

Runs on every request against the stored snapshot:

1. Compute `now` in the configured `timezone` (via `Intl.DateTimeFormat`, no date library).
2. If `now.hour >= day.endHour`, then `targetDate` = tomorrow (`isTomorrow: true`). Otherwise `targetDate` = today.
3. Headline numbers for home (`maxTemp`, `rainChance`, `condition`, `description`) come from `daily[targetDate]`.
4. The graph uses the `hourly` entries on `targetDate` with `startHour <= hour <= endHour`, which is 10 points by default.
5. `current.temp` is always the live current temperature. When `isTomorrow` is true, the UI labels it "Now" and labels the forecast "Tomorrow".
6. Office uses the same target date: `daily[targetDate].maxTemp` and `rainChance`.
7. Clothes are filtered per the rules in §4, using home's `maxTemp` and `rainChance`.

Because this runs per request, the 5pm switch-over happens on the next client refresh without any new weather API call.

---

## 8. API

### `GET /api/dashboard`

```json
{
  "generatedAt": "2026-10-16T17:05:00-07:00",
  "fetchedAt": "2026-10-16T17:00:02-07:00",
  "stale": false,
  "targetDate": "2026-10-17",
  "isTomorrow": true,
  "units": "F",
  "clientRefreshMinutes": 5,
  "home": {
    "label": "Home / School",
    "current": { "temp": 58, "condition": "cloudy", "description": "Cloudy" },
    "maxTemp": 61,
    "rainChance": 30,
    "condition": "partly-cloudy",
    "description": "Partly cloudy",
    "hourly": [
      { "hour": 8, "temp": 52, "rainChance": 10, "condition": "cloudy" },
      { "hour": 9, "temp": 54, "rainChance": 10, "condition": "partly-cloudy" }
    ]
  },
  "office": {
    "label": "Downtown",
    "maxTemp": 64,
    "rainChance": 20
  },
  "clothes": [
    { "name": "t-shirt", "image": "/assets/clothes/tshirt.svg" }
  ]
}
```

| Situation                            | Response |
|--------------------------------------|----------|
| Snapshot available                   | 200 with the body above |
| Snapshot older than 2× refresh interval | 200 with `"stale": true` |
| No snapshot yet (first fetch failed) | 503 `{ "error": "Forecast not available yet" }` |

### Static routes
- `/assets/*` serves `assets/` (clothes and weather SVGs).
- `/*` serves `dist/client` (the built Vue app). Vite emits its JS/CSS under `/static` (`build.assetsDir`) so it never collides with `/assets`.

---

## 9. Client (Vue 3)

### Data flow
- `App.vue` fetches `/api/dashboard` on load and then every `clientRefreshMinutes`.
- If a refresh fails, the last data stays on screen and a small "offline" dot appears. The page also shows a hint when `stale` is true.
- The footer shows "Updated <fetchedAt>".
- Props flow down to the components. There's no store or router.

### Layout (landscape, ~1280×800)

```
┌─────────────────────────────────────────────────────────┬──────────────────────┐
│  TODAY / TOMORROW                                       │  DOWNTOWN            │
│                                                         │                      │
│  [icon]  58°   High 61°   Rain 30%                      │   High  64°          │
│          Partly cloudy                                  │   Rain  20%          │
│                                                         │                      │
│  ┌───────────────────────────────────────────────────┐  │                      │
│  │ ☁  ⛅  ⛅  ☀  ☀  ☀  ⛅  ☁  ☁  ☁   ← icons        │  │                      │
│  │ ── temperature line with labels ──                │  │                      │
│  │ ▂  ▂  ▁  ▁  ▁  ▁  ▃  ▅  ▅  ▃   ← rain bars      │  │                      │
│  │ 8  9  10 11 12 1  2  3  4  5                      │  │                      │
│  └───────────────────────────────────────────────────┘  │                      │
│                                                         │                      │
│  [👕 t-shirt]  [🧥 raincoat]                             │  Updated 5:00 PM  ●  │
└─────────────────────────────────────────────────────────┴──────────────────────┘
          ~65% kids                                              ~35% office
```

### Components
- **KidsPanel.vue**: headline numbers, condition icon, description, chart and clothes.
- **HourlyChart.vue**: inline SVG with no chart library.
  - Rain-chance bars, scaled 0–100% (right axis, light blue).
  - Temperature line with a value label at each point (left axis, auto-scaled to min/max ± padding).
  - A condition icon above each hour (`<image href="/assets/weather/<condition>.svg">`).
  - Hour labels along the bottom (8, 9, … 5).
  - Sized with `viewBox` so it scales with its container.
- **ClothesList.vue**: large tiles, each with an SVG image and a name label. When nothing matches, it shows "No suggestion".
- **OfficePanel.vue**: label, max temp, rain chance.

### Visual rules
- Large type (the current temperature fills a good part of the header), high contrast, and nothing that depends on hover.
- Sizes use `vw`/`vh` units so the page fills the 10" screen without scrolling.

---

## 10. Running

**package.json scripts**

| Script        | Command                                    |
|---------------|--------------------------------------------|
| `dev:server`  | `node --watch src/server/index.js`         |
| `dev:client`  | `vite --config src/client/vite.config.js`  |
| `build`       | `vite build --config src/client/vite.config.js` |
| `start`       | `node src/server/index.js`                 |

- **Development**: run `dev:server` (port 3000) and `dev:client` (Vite, with `/api` and `/assets` proxied to port 3000) in two terminals.
- **Production**: run `npm run build && npm start`. One process on one port (`PORT`, default 3000). The 10" screen opens `http://<host>:3000` in a kiosk-mode browser.

---

## 11. Future ideas
- Night variants of the weather icons
- A °C/°F toggle
- A second provider (e.g. OpenWeatherMap, keyed by zip)
- Separate clothing sets per kid
- A "feels like" temperature for clothing selection
