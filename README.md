# Dress Code

A weather page for a 10" screen that helps the kids pick clothes for the day and shows the forecast downtown. See [docs/DESIGN.md](docs/DESIGN.md).

## Setup

1. Edit `config.yaml`: set the `lat`/`lon` for `home` and `office`, your `timezone`, and the clothing list.
2. Put a clothing SVG in `assets/clothes/` for every `image` in the config.

## Run

```sh
npm install
npm run build
npm start            # http://localhost:3000
```

### Using a different port

The server listens on port 3000 unless the `PORT` environment variable is set:

```sh
PORT=8080 npm start  # http://localhost:8080
```

### Running with pm2

`ecosystem.config.cjs` defines the app. Build first, then pass the file name explicitly:

```sh
npm run build
PORT=3001 pm2 start ecosystem.config.cjs   # omit PORT for 3000
pm2 save                                   # remember it across `pm2 resurrect` / startup
```

To change the port later, restart with `--update-env` (pm2 otherwise keeps the old value):

```sh
PORT=3002 pm2 restart ecosystem.config.cjs --update-env
```

Logs: `pm2 logs dress-code`.

Development (two terminals):

```sh
npm run dev:server   # API on :3000, restarts on change
npm run dev:client   # Vite with hot reload; proxies /api and /assets to :3000
```

To use a different port in development, set the same `PORT` in **both** terminals so Vite's proxy points at the right server:

```sh
PORT=8080 npm run dev:server
PORT=8080 npm run dev:client
```

Changes to `config.yaml` apply on the next page refresh. Changes to locations or the provider apply at the next hourly forecast refresh, or on restart.
