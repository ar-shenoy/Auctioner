# Auctioner - Production Deployment Guide

## 1. Environment Variables Check

### Backend (Render/Railway/etc)
Ensure these environment variables are set.

| Variable | Required | Value / Format |
|----------|----------|----------------|
| `CORS_ORIGINS` | ✅ | `https://auctioner-one.vercel.app` (Comma-separated for multiple) |
| `CORS_ORIGINS_REGEX` | ⚠️ | `^https://auctioner-.*\.vercel\.app$` (For Vercel Previews) |
| `DATABASE_URL` | ✅ | `postgresql://...` |
| `SECRET_KEY` | ✅ | (Random String) |
| `DEBUG` | ❌ | `False` |

**Important Note on CORS:**
- **DO NOT** use brackets `['...']` or quotes. Just use the raw URL.
- Example: `https://auctioner-one.vercel.app,https://another-domain.com`
- **However**, if you accidentally pasted a JSON list `["..."]`, the backend is patched to handle it.

### Frontend (Vercel/Netlify)
Ensure these environment variables are set.

| Variable | Required | Value / Format |
|----------|----------|----------------|
| `VITE_API_BASE` | ✅ | `https://auctioner-x92h.onrender.com/api/v1` (No trailing slash) |

## 2. Verification Steps

1. **Login Flow:**
   - Log in with valid credentials.
   - Reload the page. You should stay logged in.
   - If you get a **403 Error** on reload:
     - Check `CORS_ORIGINS` on the backend matches your frontend domain exactly.
     - Check `VITE_API_BASE` on the frontend is correct.

2. **Auction WebSocket:**
   - Open the Auction page.
   - Check the console for "WebSocket connected".
   - If it fails, ensure your backend supports WebSockets and `VITE_API_BASE` is https (wss will be derived automatically).

## 3. Troubleshooting

- **403 Forbidden on Reload:**
  - This usually means the `Origin` header sent by the browser does not match the allowed origins in the backend.
  - Redeploy the backend after updating `CORS_ORIGINS`.

- **Login Loop:**
  - If the app keeps redirecting to login, it means `GET /auth/me` is failing.
  - Check Network tab -> Filter by `auth/me`.
  - If status is `401` or `403`, the token is rejected or CORS is blocking it.
