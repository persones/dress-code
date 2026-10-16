import path from 'node:path';
import express from 'express';
import { ROOT, loadConfig, getConfig } from './config.js';
import * as forecastStore from './forecastStore.js';
import { buildDashboard } from './dashboard.js';

// Fail fast on a broken config at startup.
loadConfig();

const app = express();

app.get('/api/dashboard', (req, res) => {
  const snapshot = forecastStore.getSnapshot();
  if (!snapshot.home) return res.status(503).json({ error: 'Forecast not available yet' });
  res.json(buildDashboard(getConfig(), snapshot));
});

app.use('/assets', express.static(path.join(ROOT, 'assets')));
app.use(express.static(path.join(ROOT, 'dist/client')));

forecastStore.start(getConfig);

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Dress Code running on http://localhost:${port}`));
