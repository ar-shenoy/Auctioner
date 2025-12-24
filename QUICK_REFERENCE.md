# Quick Reference Guide

## 🚨 Emergency Response (< 5 minutes)

### API is DOWN (All requests failing)

```bash
# 1. Check API health
curl -I https://api.auctioner.example.com/api/v1/health

# 2. Restart API service
sudo systemctl restart auctioner-api

# 3. Check database
psql -h localhost -U appuser -d auctioner -c "SELECT 1"

# 4. Check logs
tail -50 /var/log/app.log | grep ERROR
```

→ See: [ERROR_HANDLING_RUNBOOK.md](./ERROR_HANDLING_RUNBOOK.md) - Critical Incidents

---

### High Error Rate (> 10%)

```bash
# 1. Check monitoring dashboard
# Sentry: Issues → Group by endpoint
# DataDog: Logs → filter status:error

# 2. Check recent deployment
git log --oneline -5

# 3. If recent deploy caused it
git revert HEAD && npm run build
```

→ See: [ERROR_HANDLING_RUNBOOK.md](./ERROR_HANDLING_RUNBOOK.md) - High Priority

---

### Users Stuck on Login (Many 401s)

```bash
# 1. Check token generation
grep -i "token\|jwt" /var/log/app.log | tail -20

# 2. Check HTTPS
curl -I https://api.auctioner.example.com/api/v1/health

# 3. If cert expired
# Renew with: certbot renew
```

→ See: [ERROR_HANDLING_RUNBOOK.md](./ERROR_HANDLING_RUNBOOK.md) - Authentication Failures

---

### Too Many 429 (Rate Limited) Errors

```bash
# 1. Check current limit
grep -i "rate.*limit" /var/log/app.log

# 2. Increase if needed
# Backend: MAX_REQUESTS_PER_MINUTE = 500

# 3. Check for retry loops
grep -r "429\|retry" frontend/src/ | head -10
```

→ See: [ERROR_HANDLING_RUNBOOK.md](./ERROR_HANDLING_RUNBOOK.md) - Rate Limiting

---

## 📋 Pre-Deployment Checklist (< 15 minutes)

```bash
# 1. Environment
echo $VITE_API_BASE  # Must be HTTPS

# 2. Build
npm install && npm run build

# 3. Health check
curl -I https://api.auctioner.example.com/api/v1/health

# 4. Test error handling
curl -H "Authorization: Bearer invalid" \
  https://api.auctioner.example.com/api/v1/players
# Expected: 401 with {"detail": "Token..."}

# 5. Deploy
# ... your deploy command ...

# 6. Verify
curl -X POST https://api.auctioner.example.com/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "test"}'
```

→ See: [PRODUCTION_DEPLOYMENT_CHECKLIST.md](./PRODUCTION_DEPLOYMENT_CHECKLIST.md)

---

## 🧪 Common Error Tests

### Test 401 (Token Expired)

```bash
curl -H "Authorization: Bearer invalid" \
  https://api.auctioner.example.com/api/v1/players

# Expected response:
# {"detail": "Token expired. Please log in again.", "error_type": "TOKEN_EXPIRED", ...}
```

**Frontend behavior**: Clears token, redirects to login

---

### Test 403 (Access Denied)

```bash
TOKEN="valid_user_token"
curl -H "Authorization: Bearer $TOKEN" \
  -X DELETE https://api.auctioner.example.com/api/v1/teams/1

# Expected response (non-admin):
# {"detail": "Only admins can delete teams", "error_type": "INSUFFICIENT_PERMISSIONS", ...}
```

**Frontend behavior**: Shows error message

---

### Test 429 (Rate Limited)

```bash
# Simulate high request rate
for i in {1..150}; do
  curl https://api.auctioner.example.com/api/v1/players > /dev/null &
done

# 100 requests should succeed, ~50 should get:
# {"detail": "Too many requests. Please wait 60 seconds.", "error_type": "RATE_LIMIT_EXCEEDED", ...}
```

**Frontend behavior**: Shows "Too many requests" message with wait time

---

### Test 500 (Server Error)

```bash
# Force error on backend (e.g., intentional bug)
# Then:
curl https://api.auctioner.example.com/api/v1/players

# Expected response:
# {"detail": "Internal server error. Please contact support.", "error_type": "INTERNAL_SERVER_ERROR", ...}
```

**Frontend behavior**: Shows "Server error" message

---

### Test Network Timeout

```bash
# Disconnect internet then try:
curl https://api.auctioner.example.com/api/v1/players

# After timeout (10 seconds):
# curl: (28) Operation timed out
```

**Frontend behavior**: Shows "Network error. Check connection."

---

## 📊 Monitoring Dashboard Access

### Sentry

- URL: https://sentry.io/organizations/your-org/
- Alert: Errors appear in Issues
- Filter by: endpoint, status, error type

### DataDog

- URL: https://app.datadoghq.com/
- Alert: Check Logs for errors
- Filter by: status, endpoint, timestamp

### Custom Logs

- Endpoint: `GET /api/v1/logs?filter=error`
- Query: `SELECT * FROM logs WHERE level='error' ORDER BY timestamp DESC`

---

## 🔧 Configuration Quick Reference

### Environment Variables

```bash
# Frontend (.env)
VITE_API_BASE=https://api.auctioner.example.com/api/v1

# Backend
DATABASE_URL=postgresql://user:pass@host/db
JWT_SECRET=your-secret-key
TOKEN_EXPIRY=24h
RATE_LIMIT=100/min
```

### Token Expiry Settings

```javascript
// frontend/core/api.ts - Line ~70
// 401 response → logout + redirect

// backend
TOKEN_EXPIRY = 24 * 60 * 60  # seconds (24 hours)
```

### Rate Limiting

```python
# backend
MAX_REQUESTS_PER_MINUTE = 100
# Returns 429 with Retry-After header
```

---

## 📚 Documentation Index

| Document                                                                   | Purpose                   | Time      |
| -------------------------------------------------------------------------- | ------------------------- | --------- |
| [HARDENING_SUMMARY.md](./HARDENING_SUMMARY.md)                             | Overview of all hardening | 10 min    |
| [PRODUCTION_DEPLOYMENT_CHECKLIST.md](./PRODUCTION_DEPLOYMENT_CHECKLIST.md) | Pre-flight checks         | 15 min    |
| [ERROR_HANDLING_RUNBOOK.md](./ERROR_HANDLING_RUNBOOK.md)                   | Incident response         | 30 min    |
| [MONITORING_CONFIGURATION.md](./MONITORING_CONFIGURATION.md)               | Setup monitoring          | 1-2 hours |
| [API_ERROR_RESPONSE_SPEC.md](./API_ERROR_RESPONSE_SPEC.md)                 | Backend response format   | 20 min    |

---

## 👥 Team Responsibilities

### Frontend Developer

- [ ] Verify error handling works locally
- [ ] Test all error scenarios before deploy
- [ ] Monitor error dashboard after deploy

### Backend Developer

- [ ] Implement error responses per spec
- [ ] Add rate-limiting if needed
- [ ] Return proper HTTP status codes

### DevOps/Infrastructure

- [ ] Setup monitoring service
- [ ] Configure alerts
- [ ] Maintain infrastructure

### On-Call Engineer

- [ ] Follow ERROR_HANDLING_RUNBOOK.md
- [ ] Check monitoring dashboard first
- [ ] Investigate recent changes
- [ ] Execute resolution steps

---

## 🚀 One-Click Deployment

### Build & Test

```bash
npm install && npm run build && npm test
```

### Deploy

```bash
# Option 1: Direct deploy
scp -r dist/* user@server:/var/www/auctioner/

# Option 2: Docker
docker build -t auctioner:prod .
docker push registry/auctioner:prod
docker run -p 80:80 -e VITE_API_BASE=https://api.example.com/api/v1 registry/auctioner:prod

# Option 3: Your CI/CD
git push main
# GitHub Actions / GitLab CI / Jenkins will handle deploy
```

### Verify

```bash
sleep 10  # Wait for deployment
curl https://auctioner.example.com/
# Expected: HTML page loads
curl -H "Authorization: Bearer test" https://api.auctioner.example.com/api/v1/players
# Expected: 401 (if invalid token) or 200 with data
```

---

## ❓ FAQ

### Q: User says "Session expired" after login

**A**: Token may have expired. Check:

1. Token expiry settings: `TOKEN_EXPIRY=24h`
2. HTTPS is working: `curl -I https://api.example.com`
3. Backend token generation working
   → See: ERROR_HANDLING_RUNBOOK.md - Authentication Failures

---

### Q: Error rate dashboard shows nothing

**A**: Monitoring not integrated. Check:

1. Is monitoring service running?
2. Is `sendToMonitoring()` in `core/api.ts` configured?
3. Does monitoring service have data from other sources?
   → See: MONITORING_CONFIGURATION.md

---

### Q: Users complain API is slow

**A**: Check performance:

```bash
curl -w "@curl-format.txt" -o /dev/null -s https://api.example.com/api/v1/players
# Should be < 5 seconds
psql -c "EXPLAIN ANALYZE SELECT * FROM players;"
```

→ See: ERROR_HANDLING_RUNBOOK.md - Slow Responses

---

### Q: How to test 429 rate-limiting?

**A**: Simulate high load:

```bash
ab -n 200 -c 50 https://api.example.com/api/v1/players
# Some requests should get 429
```

---

### Q: What to do during incident?

**A**: Follow this order:

1. Open ERROR_HANDLING_RUNBOOK.md
2. Find your incident type
3. Follow investigation steps
4. Execute resolution
5. Verify fix
6. Update runbook

---

## 🆘 Getting Help

### Resources

- **API Errors**: Check [API_ERROR_RESPONSE_SPEC.md](./API_ERROR_RESPONSE_SPEC.md)
- **Incident**: Check [ERROR_HANDLING_RUNBOOK.md](./ERROR_HANDLING_RUNBOOK.md)
- **Deployment**: Check [PRODUCTION_DEPLOYMENT_CHECKLIST.md](./PRODUCTION_DEPLOYMENT_CHECKLIST.md)
- **Monitoring**: Check [MONITORING_CONFIGURATION.md](./MONITORING_CONFIGURATION.md)
- **Code**: Check comments in `core/api.ts` and `components/ErrorBoundary.tsx`

### Contact

- Backend issues: Backend team
- Frontend issues: Frontend team
- Deployment issues: DevOps team
- Monitoring issues: Monitoring team lead

---

## 📌 Remember

✅ **DO**

- Check monitoring dashboard first
- Follow the runbook for your incident type
- Test error scenarios locally before deploy
- Document incidents for future reference
- Keep communication with team

❌ **DON'T**

- Expose internal error details to users
- Restart service without investigation
- Deploy without testing
- Log sensitive data (passwords, tokens)
- Panic - follow the process!
