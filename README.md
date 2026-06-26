# Events Community Frontend

Minimal Next.js frontend for the Events Community MVP.

## Environment

| Variable | Local | Production (Vercel) |
|----------|-------|---------------------|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000` | `https://your-backend.onrender.com` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID | Same client ID (add Vercel domain in Google Console) |

Copy `.env.local.example` to `.env.local` for local development.

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
