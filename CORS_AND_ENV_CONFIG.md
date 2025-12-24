# CORS and Environment Configuration - Production Deployment Guide

## Summary of Changes

This update ensures the Auctioner application is deployment-platform agnostic and works across all environments (localhost, Vercel, cloud platforms) without hardcoded URLs.

### Files Modified

| File                         | Change                                                                           | Impact                                                  |
| ---------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `core/api.ts`                | Removed hardcoded `localhost:8000` fallback, require explicit `VITE_API_BASE`    | Frontend will fail loudly if API base is not configured |
| `backend/app/core/config.py` | Added environment-based CORS parsing from comma-separated `CORS_ORIGINS` env var | Backend CORS is now fully configurable per environment  |
| `backend/app/main.py`        | Updated to use `settings.cors_origins` instead of hardcoded localhost origins    | CORS origins loaded from configuration                  |
| `.env`                       | Enhanced with documentation and example values                                   | Clearer setup for developers                            |
| `.env.example`               | Created comprehensive deployment guide                                           | Documentation for all environment variables             |
| `backend/.env.example`       | Updated to use comma-separated CORS format                                       | Clear guide for backend configuration                   |

## Configuration Details

### Frontend Configuration (VITE_API_BASE)

**Required:** Yes  
**Format:** Full URL with protocol and path  
**Default:** None (must be explicitly set)

**Examples:**

```
# Local development
VITE_API_BASE=http://localhost:8000/api/v1

# Vercel deployment
VITE_API_BASE=https://api.auctioner.com/api/v1

# Self-hosted backend
VITE_API_BASE=https://your-backend.example.com/api/v1
```

**Behavior:**

- If not set, app throws error immediately on startup
- Error message clearly indicates how to configure it
- Works with any backend origin (no hardcoded assumptions)

### Backend Configuration (CORS_ORIGINS)

**Required:** Yes  
**Format:** Comma-separated list of full origins (no spaces)  
**Default:** `http://localhost:3000,http://localhost:5173`

**Examples:**

```
# Local development
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Production with multiple environments
CORS_ORIGINS=https://app.auctioner.com,https://app-staging.auctioner.com,https://api.auctioner.com

# Mixed environments
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://app.auctioner.com
```

**How it works:**

1. Environment variable is read as comma-separated string
2. Pydantic settings parse it into a Python list
3. FastAPI middleware uses the parsed list for CORS validation
4. Each request is checked against allowed origins

## Deployment Scenarios

### Local Development

**Frontend (.env):**

```
VITE_API_BASE=http://localhost:8000/api/v1
```

**Backend (.env):**

```
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
DATABASE_URL=postgresql+asyncpg://admin:admin@localhost:5432/cricket_db
```

**Result:** Frontend and backend communicate via localhost

---

### Vercel Frontend + Custom Backend

**Frontend (Vercel Environment Variables):**

```
VITE_API_BASE=https://api.auctioner.com/api/v1
```

**Backend (Cloud Platform Environment):**

```
CORS_ORIGINS=https://auctioner.vercel.app
DATABASE_URL=postgresql+asyncpg://user:pass@db.provider.com/cricket_db
```

**Result:** Vercel frontend calls external backend with proper CORS

---

### Docker Compose (Local Network)

**Frontend (.env):**

```
# Use internal Docker network name
VITE_API_BASE=http://backend:8000/api/v1
```

**Backend (.env):**

```
# Accept requests from frontend container and localhost
CORS_ORIGINS=http://frontend:3000,http://localhost:3000
DATABASE_URL=postgresql+asyncpg://admin:admin@postgres:5432/cricket_db
```

**docker-compose.yml:**

```yaml
services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      VITE_API_BASE: http://backend:8000/api/v1
    networks:
      - cricket-network

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      CORS_ORIGINS: http://frontend:3000
      DATABASE_URL: postgresql+asyncpg://admin:admin@postgres:5432/cricket_db
    networks:
      - cricket-network

  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: admin
      POSTGRES_DB: cricket_db
    networks:
      - cricket-network

networks:
  cricket-network:
    driver: bridge
```

---

### AWS/Cloud Platform Deployment

**Frontend:**

- Environment Variable: `VITE_API_BASE=https://api.your-domain.com/api/v1`
- Set via: AWS Systems Manager Parameter Store / Lambda Environment / ECS Task Definition

**Backend:**

- Environment Variable: `CORS_ORIGINS=https://your-frontend-url.cloudfront.net`
- Set via: AWS Systems Manager Parameter Store / RDS Connection String / Secrets Manager

---

## Important Notes

### 1. No Hardcoded URLs Anywhere

- ✅ All URLs come from environment variables
- ✅ Frontend fails loudly if API base is missing
- ✅ Backend CORS is fully configurable
- ❌ No localhost:3000, localhost:8000, or 127.0.0.1 in code

### 2. CORS Format is Strict

- Format: `origin1,origin2,origin3`
- Examples: `http://localhost:3000`, `https://app.auctioner.com`
- Do NOT include trailing slashes: ❌ `http://localhost:3000/`
- Do NOT include paths: ❌ `http://localhost:3000/api`
- Do NOT include query strings: ❌ `http://localhost:3000?param=value`

### 3. HTTPS in Production

- Frontend enforces HTTPS for production builds
- Backend intercepts non-HTTPS API calls in production and throws error
- This ensures secure token transmission

### 4. Environment Variable Precedence

- Command-line environment variables override .env file
- .env file provides defaults for local development
- Cloud platform env vars override all defaults

### 5. Token Security

- Access tokens are stored in localStorage (frontend)
- Tokens are sent in `Authorization: Bearer {token}` header
- Backend validates token signature with SECRET_KEY
- Make sure SECRET_KEY is changed in production!

## Testing the Configuration

### Local Development

```bash
# Terminal 1: Backend
cd backend
export VITE_API_BASE=http://localhost:8000/api/v1
python -m uvicorn app.main:app --reload

# Terminal 2: Frontend
export VITE_API_BASE=http://localhost:8000/api/v1
npm run dev

# Open browser: http://localhost:3000
# Check Network tab: requests should go to http://localhost:8000
```

### Production Simulation

```bash
# Build frontend with production backend URL
export VITE_API_BASE=https://api.production.com/api/v1
npm run build

# Test backend CORS
curl -X OPTIONS http://localhost:8000/api/v1/auth/login \
  -H "Origin: https://app.auctioner.com" \
  -H "Access-Control-Request-Method: POST"

# Should return 200 with CORS headers if origin is in CORS_ORIGINS
```

## Error Messages

### Frontend Error (Missing VITE_API_BASE)

```
Error: API_BASE is not configured. Set VITE_API_BASE in .env or environment variables.
Example: VITE_API_BASE=http://localhost:8000/api/v1
```

### Backend CORS Error (Origin Not Allowed)

```
HTTP/1.1 403 Forbidden
{
  "detail": "CORS request rejected. Origin not in CORS_ORIGINS."
}
```

### Backend API Error (Non-HTTPS in Production)

```
Error: API endpoint must use HTTPS in production
```

## Verification Checklist

- [x] No hardcoded `localhost` in code (only in defaults)
- [x] No hardcoded ports in code
- [x] Frontend requires explicit `VITE_API_BASE`
- [x] Backend CORS uses environment variable
- [x] Both .env files documented clearly
- [x] Example configuration provided
- [x] Error messages are helpful
- [x] Works across all deployment platforms
- [x] HTTPS enforced in production
- [x] Token security maintained

## Next Steps for Deployment

1. **Local Development**

   - Copy `.env.example` to `.env`
   - Update `VITE_API_BASE` if needed
   - Run `npm run dev`

2. **Vercel (Frontend)**

   - Push code to GitHub
   - Add Environment Variable: `VITE_API_BASE=your_backend_url`
   - Deploy via Vercel CLI or dashboard

3. **Cloud Backend (AWS/Azure/GCP)**

   - Set environment variables in platform:
     - `CORS_ORIGINS=your_frontend_url`
     - `SECRET_KEY=generated_secret`
     - `DATABASE_URL=connection_string`
   - Deploy backend service

4. **Docker Deployment**
   - Use `docker-compose.yml` example above
   - Update environment variables for your setup
   - Run: `docker-compose up`

---

**All configuration is now platform-agnostic and follows production best practices.**
