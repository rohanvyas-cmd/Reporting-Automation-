# HubSpot Reporting Dashboard

A read-only full-stack dashboard for visualizing HubSpot deals with geography and lifecycle-stage breakdowns.

## Stack
- **Frontend:** React (Vite) + Tailwind CSS + Recharts
- **Backend:** Node.js + Express + `@hubspot/api-client`

---

## 1. Get a HubSpot Private App Access Token

1. Log in to HubSpot → **Settings** (gear icon, top right)
2. Go to **Integrations → Private Apps**
3. Click **Create a private app**
4. Give it a name (e.g. "Reporting Dashboard")
5. Under **Scopes**, add read access to **CRM → Deals**
6. Click **Create app** → copy the generated access token

---

## 2. Configure the `.env` File

```bash
cp .env.example .env
```

Edit the project-root `.env` file and paste your token:

```
HUBSPOT_ACCESS_TOKEN=pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PORT=3001
```

---

## 3. Customize the Deal Stage Mapping

Edit `server/config/stageMapping.js`.

Map each HubSpot deal stage ID (lowercase) to a lifecycle category:

| Category     | Meaning                                     |
|--------------|---------------------------------------------|
| `MQL`        | Marketing Qualified Lead                    |
| `SAL`        | Sales Accepted Lead                         |
| `SQL`        | Sales Qualified Lead                        |
| `Active`     | Open deal not in a closed stage             |
| `CLOSED_WON` | Won — excluded from Active count            |
| `CLOSED_LOST`| Lost — excluded from Active count           |

To find your stage IDs: HubSpot → Settings → CRM → Deals → Pipelines (hover a stage to see its ID), or call:

```
GET https://api.hubapi.com/crm/v3/pipelines/deals
Authorization: Bearer <your_token>
```

---

## 4. Customize the Geography Mapping

Edit `server/config/geoMapping.js`.

**Step 1 — Set the property name:**
```js
export const GEO_PROPERTY_NAME = 'country'; // or 'hs_deal_country', or a custom property
```

**Step 2 — Map raw values to geography codes:**
```js
export const GEO_VALUE_MAP = {
  'india': 'IN',
  'in': 'IN',
  'united states': 'US',
  'us': 'US',
  // add more as needed
};
```
Keys must be lowercase. Values must be `'IN'` or `'US'`. Deals with unmapped values show as `Unknown`.

---

## 5. Customize the Industry Mapping (Optional)

Edit `server/config/industryMapping.js`.

Set `INDUSTRY_PROPERTY_NAME` to your HubSpot deal property internal name that stores industry (custom or standard). Unmapped/empty values show as `Unknown`.
You can also override via `.env` with a comma-separated list:

```
HUBSPOT_INDUSTRY_PROPERTIES=industry,industry__c,custom_industry
```

---

## 6. Run the App

**Install all dependencies:**
```bash
npm install               # installs concurrently at root
npm run install:all       # installs server + client dependencies
```

**Run both dev servers concurrently:**
```bash
npm run dev
```

Or run separately:
```bash
npm run dev:server   # http://localhost:3001
npm run dev:client   # http://localhost:5173
```

If you change `.env` while `npm run dev` is running, the backend will restart automatically. If you use `npm run start`, restart the server manually after any env change.

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Architecture Notes

- The frontend never calls HubSpot directly — all requests go through the Express server.
- Deal data is cached in memory for 5 minutes. Click **Refresh Data** to force a re-fetch.
- The app is strictly read-only — no writes, updates, or deletes are performed.

---

## Deployment (GCP)

### Recommended layout
- **Backend:** Cloud Run
- **Frontend:** Firebase Hosting or another static host in GCP

This repo already fits that model:
- The backend is a plain Express app that listens on `process.env.PORT`.
- The frontend reads `VITE_API_BASE_URL` at build time.

### 1) Deploy the backend to Cloud Run
1. Create or select a Google Cloud project.
2. Enable the required APIs: Cloud Run, Cloud Build, and Artifact Registry.
3. Deploy the `server` directory as a Cloud Run service.

Example:
```bash
gcloud run deploy gtm-dashboard-api \
  --source ./server \
  --region us-central1 \
  --allow-unauthenticated
```

4. Add these environment variables or secrets in Cloud Run:
   - `HUBSPOT_ACCESS_TOKEN`
   - `GOOGLE_CLIENT_ID`
   - `JWT_SECRET`
   - `ALLOWED_EMAILS` (comma-separated)
   - `CORS_ORIGINS` (your frontend origin, e.g. `https://your-site.web.app`)
5. Copy the Cloud Run service URL.

### 2) Deploy the frontend to Firebase Hosting
1. Set the client env vars for production:
   - `VITE_GOOGLE_CLIENT_ID` should match the backend `GOOGLE_CLIENT_ID`
   - `VITE_API_BASE_URL` should be the Cloud Run URL from step 1
2. Build the client:
```bash
npm run build --prefix client
```
3. Deploy the `client/dist` output with Firebase Hosting.

If you use Firebase Hosting, make sure the site rewrites all routes to `index.html` so the SPA works on refresh.

### 3) Update Google OAuth
1. In Google Cloud Console, open the OAuth client used by the app.
2. Add your production frontend domain to the authorized JavaScript origins.
3. Keep local dev origins too, such as `http://localhost:5173`.

### 4) Verify
1. Open the frontend URL.
2. Sign in with Google.
3. Click **Refresh Data** and confirm the Cloud Run API responds.

### Optional: single-service deployment
If you want everything behind one GCP service, I can add a small Dockerfile and static file serving so Cloud Run hosts both the API and the built React app. That is a clean next step, but it is not required for the migration.
