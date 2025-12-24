# Auctioner Deployment Guide

This guide covers how to deploy the Auctioner system to production. The system consists of two independent components:
1. **Backend** (FastAPI/Python) - Deployed on Render/Railway/Fly.io
2. **Frontend** (React/Vite) - Deployed on Vercel/Netlify

## 1. Backend Deployment

### Prerequisites
- A PostgreSQL database (e.g., Supabase, Neon, or managed Postgres).
- A cloud hosting provider (Render is recommended for ease of use).

### Environment Variables
Set these variables in your backend hosting service:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://user:pass@host:5432/db` |
| `SECRET_KEY` | Secret for JWT encryption | `openssl rand -hex 32` |
| `CORS_ORIGINS` | Allowed frontend origins (comma-separated) | `https://my-auction-app.vercel.app` |
| `DEBUG` | Debug mode (Set to `false` in prod) | `false` |
| `PORT` | Port to listen on | `8000` |

### Deployment Steps (Render Example)
1. **Connect Repository**: Connect your GitHub repo to Render.
2. **Root Directory**: Set to `backend`.
3. **Build Command**: `pip install -r requirements.txt`
4. **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. **Add Environment Variables**: Add the variables listed above.
6. **Deploy**: Click "Create Web Service".

### Database Setup
1. Create a PostgreSQL database.
2. Obtain the connection string.
3. Ensure it starts with `postgresql+asyncpg://` (replace `postgres://` if needed).
4. Run migrations (if applicable) or ensure schema is initialized. *Note: Current codebase uses `create_db` or similar scripts; verify schema creation.*

---

## 2. Frontend Deployment

### Prerequisites
- URL of the deployed backend (e.g., `https://my-api.onrender.com/api/v1`).

### Environment Variables
Set these variables in your frontend hosting service:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE` | Full URL to backend API (must end in `/api/v1`) | `https://my-api.onrender.com/api/v1` |

### Deployment Steps (Vercel Example)
1. **Import Project**: Import your GitHub repo to Vercel.
2. **Framework Preset**: Vite.
3. **Root Directory**: `./` (Root).
4. **Build Command**: `npm run build` (Default).
5. **Output Directory**: `dist` (Default).
6. **Environment Variables**: Add `VITE_API_BASE`.
7. **Deploy**: Click "Deploy".

---

## 3. End-to-End Verification

Once both services are deployed:

1. **Backend Health Check**:
   - Visit `https://your-backend.com/health`
   - Expect: `{"status": "healthy", ...}`

2. **Frontend Load**:
   - Visit `https://your-frontend.com`
   - Expect: Login page loads.

3. **Login Verification**:
   - Attempt login with valid credentials (from your DB).
   - Expect: Successful redirect to Dashboard.
   - *Failure*: If login fails with "Network Error", check CORS settings on backend and `VITE_API_BASE` on frontend.

4. **Data Verification**:
   - Verify Players and Teams load from the database.
   - Verify Auction page loads without errors.

---

## 4. Troubleshooting

- **CORS Errors**: Ensure `CORS_ORIGINS` in backend includes your frontend URL (no trailing slash).
- **Connection Refused**: Ensure `DATABASE_URL` is correct and accessible from the backend region.
- **Frontend 404s**: Ensure `VITE_API_BASE` includes `/api/v1` suffix.
