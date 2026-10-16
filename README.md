# Dress Code

A weather page for a 10" screen that helps the kids pick clothes for the day and shows the forecast downtown. See [docs/DESIGN.md](docs/DESIGN.md).

## Setup

1. Edit `config.yaml`: set the `lat`/`lon` for `home` and `office`, your `timezone`, and the clothing list.
2. Put a clothing SVG in `assets/clothes/` for every `image` in the config.

## Run

```sh
npm install
npm run build
npm start            # http://localhost:3000 (PORT env var to change)
```

Development (two terminals):

```sh
npm run dev:server   # API on :3000, restarts on change
npm run dev:client   # Vite with hot reload; proxies /api and /assets to :3000
```

Changes to `config.yaml` apply on the next page refresh. Changes to locations or the provider apply at the next hourly forecast refresh, or on restart.
