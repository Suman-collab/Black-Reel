# Black Reel Monorepo

## Setup

### 1. Environment Variables
Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

### 2. Firebase Setup
- Go to https://console.firebase.google.com
- Select your project → Project Settings → Your Apps → Web
- Copy the firebaseConfig values into .env:
  - VITE_FIREBASE_API_KEY
  - VITE_FIREBASE_AUTH_DOMAIN
  - VITE_FIREBASE_PROJECT_ID
  - VITE_FIREBASE_STORAGE_BUCKET
  - VITE_FIREBASE_MESSAGING_SENDER_ID
  - VITE_FIREBASE_APP_ID
- Go to Authentication → Sign-in method → Enable Google
- Add localhost to Authorized Domains

### 3. Start Development
```bash
cd Backend && npm run dev
cd Frontend && npm run dev
cd Admin && npm run dev
```

### IMPORTANT
After editing .env you MUST restart the dev server.
Vite does not hot-reload environment variable changes.

---

Black Reel contains three applications:

1. `Backend` - Express + MongoDB API.
2. `Frontend` - React user app.
3. `Admin` - React admin dashboard.

## Local Development

1. Start backend:
   - `cd Backend`
   - `npm install`
   - `npm run dev`
2. Start frontend:
   - `cd Frontend`
   - `npm install`
   - `npm run dev`
3. Start admin:
   - `cd Admin`
   - `npm install`
   - `npm run dev`

## Environment Notes

Backend requires MongoDB and Firebase Admin credentials.

In production, set at minimum:

1. `MONGO_URI`
2. `FIREBASE_PROJECT_ID`
3. `FIREBASE_CLIENT_EMAIL`
4. `FIREBASE_PRIVATE_KEY`
5. `JWT_SECRET`
6. `PAYMENT_WEBHOOK_SECRET`
7. `ALLOWED_ORIGINS`
8. `GOOGLE_CLIENT_ID`
9. `GOOGLE_CLIENT_SECRET`
10. `GOOGLE_CALLBACK_URL`

Google OAuth callback setup:

1. In Google Cloud Console, add an authorized redirect URI:
   - `http://localhost:5000/api/v1/auth/google/callback` for local development.
2. For production, add your deployed backend callback URL and set `GOOGLE_CALLBACK_URL` to match it exactly.

Seeding behavior:

1. `SEED_ON_STARTUP=true` to force seeding.
2. In non-production, seeding runs by default unless `SEED_ON_STARTUP=false`.
3. In production, seeding is disabled unless explicitly enabled.
