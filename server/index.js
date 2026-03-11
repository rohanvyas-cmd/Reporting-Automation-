import express from 'express';
import { getHubSpotAccessToken, getLoadedEnvPath, getTokenFingerprint, loadEnvironment } from './utils/env.js';

import cors from 'cors';
import dealsRouter from './routes/deals.js';
import authRouter from './routes/auth.js';
import { requireAuth } from './middleware/requireAuth.js';

loadEnvironment();

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/auth', authRouter);
app.use('/api/deals', requireAuth, dealsRouter);

// 404 fallback
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => {
  const envPath = getLoadedEnvPath();
  const hubSpotToken = getHubSpotAccessToken();

  console.log(`HubSpot Dashboard API running on http://localhost:${PORT}`);
  console.log(`Environment loaded from ${envPath ?? 'no .env file found'}`);

  if (hubSpotToken) {
    console.log(`HubSpot token detected (${getTokenFingerprint(hubSpotToken)})`);
  } else {
    console.warn('HUBSPOT_ACCESS_TOKEN is not set.');
  }
});
