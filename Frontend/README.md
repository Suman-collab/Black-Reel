# Black Reel Frontend

React + Vite user-facing app.

## Run

1. `npm install`
2. `npm run dev`

## Deploy (Vercel)

Use these settings in the Frontend Vercel project:

1. Root Directory: `Frontend`
2. Framework Preset: `Vite`
3. Build Command: `npm run build`
4. Output Directory: `dist`

## Key Environment Variables

1. `VITE_API_URL` (default: `http://localhost:5000/api/v1`)
2. `VITE_FIREBASE_API_KEY`
3. `VITE_FIREBASE_AUTH_DOMAIN`
4. `VITE_FIREBASE_PROJECT_ID`
5. `VITE_FIREBASE_STORAGE_BUCKET`
6. `VITE_FIREBASE_MESSAGING_SENDER_ID`
7. `VITE_FIREBASE_APP_ID`

For production, set `VITE_API_URL` to the deployed backend base URL, for example:

`https://your-backend-domain/api/v1`

## Pre-push Checks

Run before pushing to reduce failed deployments:

1. `npm ci`
2. `npm run lint`
3. `npm run build`

## About Canceled Vercel Checks

If several commits are pushed quickly, older Vercel builds can appear as "Canceled from the Vercel Dashboard". This is expected. Only the latest deployment status for the newest commit should be treated as required.
