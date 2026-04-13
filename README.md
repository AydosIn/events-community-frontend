# Events Community Frontend

Minimal Next.js frontend for the Events Community MVP.

## Environment

Set:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

For Vercel, `NEXT_PUBLIC_API_BASE_URL` must be your public backend URL, not `localhost`.
Example:

```text
NEXT_PUBLIC_API_BASE_URL=https://your-backend-service.onrender.com
```

## Run

```powershell
npm install
npm run dev
```

This frontend expects the FastAPI backend to run on port `8000`.
