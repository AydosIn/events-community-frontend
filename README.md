# Events Community Frontend

Minimal Next.js frontend for the Events Community MVP.

## Environment

| Variable | Local | Production (Vercel) |
|----------|-------|---------------------|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000` | `https://your-backend.onrender.com` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID | Same client ID (add Vercel domain in Google Console) |

Copy `.env.local.example` to `.env.local` for local development.

### Google sign-in setup

1. In [Google Cloud Console](https://console.cloud.google.com/), create an OAuth 2.0 **Web application** client.
2. Add authorized JavaScript origins for every frontend URL you use, for example:
   - `http://localhost:3000`
   - `https://events-community-frontend.vercel.app`
3. Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `.env.local` (local) and in Vercel project settings (production).
4. Set the same value as `GOOGLE_CLIENT_ID` on the backend host (Render/DigitalOcean).
5. Ensure backend `CORS_ORIGINS` includes your Vercel frontend URL.

The Google button appears on `/login` and `/register` once `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is configured.

**Important:** In production, `NEXT_PUBLIC_API_BASE_URL` must be your public backend URL, not `localhost`. The app will throw an error if it detects localhost on a deployed host.

Backend `CORS_ORIGINS` must include your Vercel frontend URL (e.g. `https://your-app.vercel.app`).

## Run

```powershell
npm install
npm run dev
```

## Build

```powershell
npm run build
npm run start
```

This frontend expects the FastAPI backend on port `8000` locally.
