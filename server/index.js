import express from 'express';
import { getHubSpotAccessToken, getLoadedEnvPath, getTokenFingerprint, loadEnvironment } from './utils/env.js';

import cors from 'cors';
import dealsRouter from './routes/deals.js';
import authRouter from './routes/auth.js';
import { requireAuth } from './middleware/requireAuth.js';

loadEnvironment();

const app = express();
const PORT = process.env.PORT ?? 3001;
const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowAllOrigins = allowedOrigins.includes('*');

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowAllOrigins) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
  })
);
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
