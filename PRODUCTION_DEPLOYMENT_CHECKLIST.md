# Production Deployment Checklist

This checklist ensures the Auctioner application is properly hardened and ready for production deployment.

## ✅ Security Hardening (COMPLETED)

### API Communication

- [x] HTTPS validation in production (enforced in `core/api.ts`)
- [x] JWT token attached to all requests
- [x] Token expiry handling (401 response triggers logout & redirect)
- [x] Secure HttpOnly cookie flags (if using cookies)
- [x] CORS configured on backend
- [x] Rate-limit handling (429 responses with user-friendly messages)
- [x] Error message sanitization (no sensitive data in responses)

### Error Handling & Monitoring

- [x] Global Error Boundary (`components/ErrorBoundary.tsx`)
  - Catches component tree errors
  - Shows user-friendly error pages
  - Logs errors for monitoring
  - Tracks error frequency for support escalation
- [x] API error interceptors (`core/api.ts`)
  - Handles 401 (token expired)
  - Handles 403 (forbidden)
  - Handles 429 (rate limited)
  - Handles 5xx (server errors)
  - Handles network timeouts
- [x] Request/response monitoring hooks
  - Logs request duration
  - Tracks slow requests (> 5 seconds)
  - Sends to monitoring service in production

### Data Protection

- [x] No sensitive data in localStorage
- [x] JWT token cleared on logout
- [x] Session restoration on page refresh

---

## 📋 Pre-Deployment Checklist

### Environment Configuration

- [ ] `VITE_API_BASE` set to production API URL (HTTPS only)
  ```bash
  VITE_API_BASE=https://api.auctioner.example.com/api/v1
  ```
- [ ] `VITE_API_BASE` uses HTTPS (verified by API client)
- [ ] Backend API is accessible from production domain
- [ ] CORS headers configured on backend
  ```
  Access-Control-Allow-Origin: https://auctioner.example.com
  Access-Control-Allow-Credentials: true
  ```
- [ ] Backend has rate-limiting configured (recommended: 100 req/min per IP)

### Build Optimization

- [ ] Run build command and verify no errors
  ```bash
  npm run build
  ```
- [ ] Verify bundle size is reasonable
  ```bash
  npm run build -- --analyze
  ```
- [ ] Check for unused dependencies
  ```bash
  npm prune --production
  ```
- [ ] Environment variables are not exposed in bundle
  - [ ] `VITE_API_BASE` is used dynamically (not hardcoded)

### Frontend Testing

- [ ] Test login/logout flow
- [ ] Test token refresh (if implemented)
- [ ] Test 401 error handling
  - [ ] Verify logout and redirect to login
  - [ ] Verify UI shows error message
- [ ] Test 403 error handling
  - [ ] Verify user sees "Access denied" message
- [ ] Test 429 rate-limit handling
  - [ ] Verify user-friendly message is shown
  - [ ] Verify retry button/wait timer works
- [ ] Test 5xx error handling
  - [ ] Verify user sees "Server error" message
- [ ] Test network timeout
  - [ ] Disconnect internet and verify error message
- [ ] Test error boundary
  - [ ] Verify refresh and "Go Home" buttons work
  - [ ] Verify error details shown in development mode

### Backend Configuration

- [ ] API responds with appropriate HTTP status codes
  - [ ] 401 for expired/invalid tokens
  - [ ] 403 for insufficient permissions
  - [ ] 429 with `Retry-After` header
  - [ ] 5xx for server errors
- [ ] Error responses include `detail` field
  ```json
  {
    "detail": "User-friendly error message"
  }
  ```
- [ ] Rate-limiting is enabled
  - [ ] Returns 429 status
  - [ ] Includes `Retry-After` header
- [ ] Monitoring/logging is configured
  - [ ] Error logs captured
  - [ ] API logs tracked
  - [ ] Slow requests monitored

### Deployment Infrastructure

- [ ] SSL/TLS certificate installed and valid
- [ ] HTTPS redirect (HTTP → HTTPS)
- [ ] HSTS header configured
  ```
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  ```
- [ ] CSP header configured
  ```
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'
  ```
- [ ] X-Content-Type-Options header set
  ```
  X-Content-Type-Options: nosniff
  ```
- [ ] X-Frame-Options header set
  ```
  X-Frame-Options: DENY
  ```

### Monitoring & Alerting

- [ ] Monitoring service integrated (Sentry, DataDog, CloudWatch, etc.)
- [ ] Error tracking is active
- [ ] API performance tracking is enabled
- [ ] Alerting configured for:
  - [ ] High error rate (> 5% of requests)
  - [ ] Rate-limiting events (429 responses)
  - [ ] Token expiry spike
  - [ ] Server errors (5xx)
- [ ] Dashboard for monitoring is accessible

### Database & Backend

- [ ] Database backups configured
- [ ] Database migrations applied
- [ ] Connection pool configured appropriately
- [ ] Query performance optimized
- [ ] Database credentials secured (environment variables)

### Logging & Debugging

- [ ] Console logs disabled in production bundle
  ```javascript
  // In production, console.log should be stripped
  if (import.meta.env.MODE === "production") {
    console.log = () => {};
  }
  ```
- [ ] Source maps available for debugging (optional, for monitoring)
- [ ] Error stack traces captured but not exposed to users

### Performance

- [ ] Assets cached appropriately
  - [ ] CSS/JS cached for 1 year (with hash)
  - [ ] HTML cached for 1 day (no-cache)
- [ ] Compression enabled (gzip/brotli)
- [ ] CDN configured (optional)
- [ ] Lazy loading configured for pages

### Documentation

- [ ] Deployment procedure documented
- [ ] Rollback procedure documented
- [ ] On-call troubleshooting guide created
  - [ ] High error rate response
  - [ ] Rate-limiting issues
  - [ ] Authentication failures
  - [ ] Server down response
- [ ] API documentation updated

---

## 🚀 Deployment Steps

### 1. Pre-Deployment Verification

```bash
# Install dependencies
npm install

# Build application
npm run build

# Verify build output
ls -lah dist/
```

### 2. Environment Setup

```bash
# Set environment variables (on server)
export VITE_API_BASE=https://api.auctioner.example.com/api/v1

# Verify
echo $VITE_API_BASE
```

### 3. Health Check

```bash
# Verify API is accessible
curl -I https://api.auctioner.example.com/api/v1/health

# Expected: 200 OK
```

### 4. Deploy

```bash
# Copy dist/ to web server
scp -r dist/* user@server:/var/www/auctioner/

# Or with Docker
docker build -t auctioner:latest .
docker run -p 80:80 -e VITE_API_BASE=https://api.example.com/api/v1 auctioner:latest
```

### 5. Post-Deployment Verification

```bash
# Test login flow
curl -X POST https://auctioner.example.com/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test"}'

# Test API call with token
TOKEN="eyJ..."
curl -H "Authorization: Bearer $TOKEN" \
  https://auctioner.example.com/api/v1/players

# Test error handling
curl -H "Authorization: Bearer invalid" \
  https://auctioner.example.com/api/v1/players
# Expected: 401 Unauthorized
```

---

## 📊 Monitoring Setup

### Error Tracking Service Integration

**Option 1: Sentry (Recommended)**

```typescript
// In main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: import.meta.env.MODE === "production" ? 0.1 : 1.0,
});
```

**Option 2: Custom Logging Endpoint**

```typescript
// In core/api.ts
function sendToMonitoring(logEntry: any) {
  fetch(`${API_BASE}/logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(logEntry),
  }).catch(() => {});
}
```

### Key Metrics to Monitor

- API request success rate
- Average response time per endpoint
- 4xx vs 5xx error ratio
- Rate-limit (429) response rate
- Token expiry (401) spike
- Network error rate
- Component error boundary catches

---

## 🔄 Incident Response Procedures

### High Error Rate (> 5% of requests)

1. Check monitoring dashboard for affected endpoints
2. Check backend logs for errors
3. If 5xx errors: Restart backend service
4. If 4xx errors: Check client logic
5. If network errors: Check DNS/routing

### Rate-Limiting Issues

1. Check if backend rate-limiting is too strict
2. Review recent traffic spike
3. Temporarily increase rate limit if needed
4. Implement pagination/caching on frontend

### Authentication Failures

1. Check token generation on backend
2. Verify HTTPS connection
3. Check token expiry settings
4. Clear localStorage and retry login

### Server Down

1. Check backend service status
2. Check database connectivity
3. Restore from backup if needed
4. Update status page

---

## ✔️ Sign-Off

- **Frontend Developer**: ******\_\_\_\_****** Date: **\_\_**
- **Backend Developer**: ******\_\_\_\_****** Date: **\_\_**
- **DevOps/Infrastructure**: ******\_\_\_\_****** Date: **\_\_**
- **QA/Testing**: ******\_\_\_\_****** Date: **\_\_**
- **Product Manager**: ******\_\_\_\_****** Date: **\_\_**

---

## 📝 Notes

- This checklist should be reviewed and updated for each deployment
- Customize error handling to match your backend API
- Ensure all team members understand error handling flows
- Test error scenarios in staging before production
