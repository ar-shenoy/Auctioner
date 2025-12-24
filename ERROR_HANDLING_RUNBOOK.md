# Error Handling & Troubleshooting Runbook

This document provides step-by-step procedures for handling common errors and incidents in production.

---

## 🎯 Quick Reference

| Error         | Status | Cause                    | User Impact             | Action                 |
| ------------- | ------ | ------------------------ | ----------------------- | ---------------------- |
| Token Expired | 401    | Session timeout          | Logged out              | Auto-redirect to login |
| Access Denied | 403    | Insufficient permissions | "Access denied" message | Contact admin          |
| Rate Limited  | 429    | Too many requests        | Request blocked         | Wait & retry           |
| Server Error  | 5xx    | Backend issue            | Request failed          | Contact support        |
| Network Error | N/A    | Connection issue         | Cannot reach server     | Check internet         |

---

## 🔴 Critical Incidents (Page On-Call)

### Incident: API Completely Down (All Requests Failing)

**Symptoms**:

- All API requests return 5xx errors
- Users cannot perform any action
- Error rate dashboard shows 100%

**Investigation**:

```bash
# 1. Check API health
curl -I https://api.auctioner.example.com/api/v1/health

# 2. Check backend logs
ssh user@backend-server
tail -f /var/log/app.log | grep ERROR

# 3. Check system resources
free -h          # Memory
df -h            # Disk space
top -b -n 1      # CPU, processes

# 4. Check database connectivity
psql -h localhost -U appuser -d auctioner -c "SELECT 1"
```

**Resolution**:

1. **If service crashed**: Restart service

   ```bash
   sudo systemctl restart auctioner-api
   ```

2. **If database is down**: Restore from backup

   ```bash
   sudo systemctl restart postgresql
   # If still down, restore from backup
   ```

3. **If out of disk space**: Clean up

   ```bash
   # Clear logs
   sudo journalctl --vacuum=100M
   # Clear temp files
   sudo rm -rf /tmp/*
   ```

4. **If memory exhausted**: Restart service
   ```bash
   sudo systemctl restart auctioner-api
   # Add more memory if persistent
   ```

**Verification**:

```bash
# Test API
curl https://api.auctioner.example.com/api/v1/health
# Should return 200 OK
```

**Communication**:

- [ ] Update status page
- [ ] Notify on-call team
- [ ] Send email to users if > 5 minutes downtime

---

### Incident: High Error Rate (> 10%)

**Symptoms**:

- Dashboard shows error rate spike
- Users reporting "request failed" messages
- Specific endpoint(s) affected

**Investigation**:

```bash
# 1. Check monitoring dashboard for affected endpoints
# Sentry: Error > Issues > Group by error type
# DataDog: Logs > Filter by status:error

# 2. Check recent deployments
git log --oneline -10
# Was there a recent deploy? Might need to rollback

# 3. Check backend logs for specific errors
ssh user@backend-server
tail -100 /var/log/app.log | grep -A 5 ERROR

# 4. Check resource usage
top -b -n 1 | head -20
free -h
df -h

# 5. Check database performance
psql -h localhost -U appuser -d auctioner
SELECT * FROM pg_stat_activity WHERE state='active';
```

**Resolution**:

**If recent deployment caused issue**:

```bash
# Rollback to previous version
git revert HEAD
npm run build
# Deploy previous version
```

**If database slow**:

```bash
# Check for long-running queries
SELECT pid, usename, application_name, state, query
FROM pg_stat_activity
WHERE state = 'active';

# Kill long-running query if needed
SELECT pg_terminate_backend(pid);

# Analyze slow queries
EXPLAIN ANALYZE SELECT * FROM players WHERE team_id = 1;
```

**If memory leak**:

```bash
# Restart service to clear memory
sudo systemctl restart auctioner-api

# Monitor memory usage
watch -n 1 'free -h | grep Mem'
```

**Verification**:

- [ ] Error rate drops below 5% within 5 minutes
- [ ] Users can complete actions
- [ ] No pending error alerts

---

## 🟠 High Priority (Create Incident Ticket)

### Incident: Authentication Failures (401 errors)

**Symptoms**:

- Users seeing "Session expired" messages
- Spike in 401 errors (> 10 per minute)
- Users forced to login repeatedly

**Common Causes**:

1. Token expiry time too short
2. Token refresh not working
3. HTTPS issues (cookies not sent)
4. Backend token validation failing

**Investigation**:

```bash
# 1. Check token expiry settings
grep -r "token.* expir" backend/src/

# 2. Test login flow
curl -X POST https://api.auctioner.example.com/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test"}'

# Response should include token:
# {"access_token": "eyJ...", "user": {...}}

# 3. Test with token
TOKEN="eyJ..."
curl -H "Authorization: Bearer $TOKEN" \
  https://api.auctioner.example.com/api/v1/players

# Should return 200 OK with data
```

**Resolution**:

**If tokens too short-lived**:

- Increase token expiry time (default: 24 hours)
- Or implement token refresh endpoint

**If HTTPS issue**:

```bash
# Verify HTTPS
curl -I https://api.auctioner.example.com/api/v1/health
# Check for SSL certificate error
# If cert expired, renew it

# Check if API returns HTTPS-only
# Should see: Strict-Transport-Security header
```

**If backend issue**:

```bash
# Check backend logs
grep -i "401\|token" /var/log/app.log | tail -20

# Check token signing key (if using JWT)
# Verify key hasn't changed between deployments
```

**Verification**:

- [ ] Login works
- [ ] API calls with token succeed
- [ ] 401 errors drop to baseline

---

### Incident: Rate-Limiting Issues (429 errors)

**Symptoms**:

- Users see "Too many requests" error
- Legitimate traffic being blocked
- Spike in 429 responses

**Common Causes**:

1. Rate limit rules too strict
2. Retry loop in frontend
3. Bot/crawler traffic
4. Sudden traffic spike

**Investigation**:

```bash
# 1. Check rate-limit headers
curl -I https://api.auctioner.example.com/api/v1/players

# Look for rate-limit headers:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 50
# X-RateLimit-Reset: 1609459200

# 2. Check request logs by IP
tail -1000 /var/log/nginx/access.log | \
  awk '{print $1}' | sort | uniq -c | sort -rn

# High single IP = rate-limited user or bot

# 3. Check for retry loops in frontend
grep -r "retry\|setTimeout" frontend/src/ | grep -i "429\|rate"
```

**Resolution**:

**If too strict**:

```python
# Backend (FastAPI example)
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Increase limit from 100 to 500 per minute
    limiter.LIMIT = "500 per minute"
```

**If retry loop**:

```typescript
// Frontend: core/api.ts
// Don't retry 429 responses automatically
if (response?.status === 429) {
  // Show user message, don't auto-retry
  return Promise.reject(new Error("Too many requests..."));
}
```

**If bot traffic**:

```nginx
# Nginx configuration
location ~ ^/api/v1/ {
  # Block bad bots
  if ($http_user_agent ~* (bot|crawler|spider|scraper)) {
    return 403;
  }
}
```

**Verification**:

- [ ] Legitimate users can make requests
- [ ] 429 error rate drops
- [ ] "Retry-After" headers working

---

## 🟡 Medium Priority (Notify Team)

### Incident: Slow API Responses (P95 > 10 seconds)

**Symptoms**:

- Dashboard shows slow request times
- Users report application feels sluggish
- Some endpoints responding slowly

**Investigation**:

```bash
# 1. Identify slow endpoint(s)
# From monitoring dashboard:
# Group by endpoint, sort by response time

# 2. Check backend query performance
psql -h localhost -U appuser -d auctioner
EXPLAIN ANALYZE SELECT * FROM players WHERE team_id = 1;

# Look for:
# - Seq Scan (slow) vs Index Scan (fast)
# - High execution time

# 3. Check for missing indexes
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename;

# 4. Check database connection pool
# From backend logs: "Connection pool exhausted"
```

**Resolution**:

**If missing index**:

```sql
-- Create index on frequently filtered column
CREATE INDEX idx_players_team_id ON players(team_id);

-- Verify index created
EXPLAIN ANALYZE SELECT * FROM players WHERE team_id = 1;
-- Should now show Index Scan
```

**If N+1 queries**:

```python
# Backend: Optimize queries
# BEFORE (N+1 problem)
teams = Team.query.all()
for team in teams:
    print(team.players)  # Separate query for each team!

# AFTER (optimized)
teams = Team.query.options(joinedload('players')).all()
# Single query with JOIN
```

**If connection pool exhausted**:

```python
# Backend (SQLAlchemy example)
engine = create_engine(
    DATABASE_URL,
    pool_size=20,          # Increase from default
    max_overflow=10,       # Allow overflow
    pool_pre_ping=True,    # Check connections before use
)
```

**Verification**:

- [ ] P95 response time < 10 seconds
- [ ] No slow query warnings
- [ ] Index usage verified

---

### Incident: Intermittent Errors (Random 5xx)

**Symptoms**:

- Users report "Something went wrong"
- Errors not consistent (sometimes work, sometimes fail)
- Hard to reproduce

**Common Causes**:

1. Race condition in code
2. Timeout issues
3. Resource contention
4. Flaky external service

**Investigation**:

```bash
# 1. Check for error patterns
grep "ERROR\|Exception" /var/log/app.log | \
  awk -F' ' '{print $NF}' | sort | uniq -c | sort -rn
# Look for repeated errors

# 2. Check logs during incident time
sudo journalctl --since "2024-01-15 14:00:00" --until "2024-01-15 14:30:00" | \
  grep -i error

# 3. Check system load
# When did errors occur? Check CPU/memory/disk at that time

# 4. Check for external service issues
# If using third-party APIs, check their status page
```

**Resolution**:

**If race condition**:

```python
# Add locking/transactions
from sqlalchemy import func

@app.post("/api/v1/auction/bid")
async def place_bid(bid: BidRequest):
    # Use transaction to prevent race condition
    with Session() as session:
        # Lock row
        item = session.query(Item).with_for_update().get(bid.item_id)

        # Check current bid
        current_bid = item.current_bid

        # Place new bid
        if bid.amount > current_bid:
            item.current_bid = bid.amount
            session.commit()
```

**If timeout**:

```python
# Increase timeout
api_timeout = 30  # seconds

@app.post("/api/v1/long-operation")
async def long_operation():
    try:
        result = await asyncio.wait_for(
            expensive_operation(),
            timeout=30
        )
    except asyncio.TimeoutError:
        return {"error": "Operation timed out"}
```

**Verification**:

- [ ] Error rate drops to < 1%
- [ ] No intermittent errors in logs
- [ ] Specific scenario fixed

---

## 🟢 Low Priority (Log & Monitor)

### Monitor: Application Performance Degradation

**Metrics to Track**:

- Response time trends (P50, P95, P99)
- Error rate trending
- Memory usage
- CPU usage
- Request rate

**Action**:

- Review weekly if trending worse
- Schedule optimization if P95 > 8 seconds
- Plan capacity if approaching limits

---

## 📋 Incident Response Checklist

### During Incident

- [ ] **1. Acknowledge alert** - Note time
- [ ] **2. Gather info** - Monitoring dashboard, logs
- [ ] **3. Identify scope** - Which users? Which features?
- [ ] **4. Assess impact** - Critical/High/Medium/Low
- [ ] **5. Notify team** - Slack, page on-call if critical
- [ ] **6. Begin investigation** - Review recent changes, logs, metrics
- [ ] **7. Implement fix** - Code change, config change, restart, etc.
- [ ] **8. Deploy fix** - To production
- [ ] **9. Verify resolution** - Test manually, check metrics drop
- [ ] **10. Update status** - Status page, user communication

### After Incident

- [ ] **1. Document incident** - What happened, root cause, resolution
- [ ] **2. Create ticket** - To prevent recurrence
- [ ] **3. Schedule post-mortem** - Review and discuss
- [ ] **4. Implement fix** - Code change, monitoring, automation
- [ ] **5. Update runbook** - Add to this document
- [ ] **6. Communicate lessons** - Team discussion

---

## 🚀 Prevention: Proactive Monitoring

### Daily Checks (5 minutes)

- [ ] Error rate below 1%
- [ ] Response time P95 < 8 seconds
- [ ] No critical alerts

### Weekly Checks (15 minutes)

- [ ] Review slowest endpoints
- [ ] Check disk space
- [ ] Review error trends
- [ ] Check backup status

### Monthly Checks (1 hour)

- [ ] Capacity planning review
- [ ] Security audit
- [ ] Dependency updates
- [ ] Documentation review

---

## 📞 Escalation Path

**Level 1**: On-Call Engineer (you are here)

- Can investigate, restart services, temporarily increase limits
- First response: < 5 minutes

**Level 2**: Engineering Manager

- Involved if Level 1 cannot resolve in 15 minutes
- Can authorize larger changes

**Level 3**: VP Engineering

- Involved if critical incident lasting > 1 hour
- Can authorize vendor escalation

---

## 🔗 Related Documents

- [Production Deployment Checklist](./PRODUCTION_DEPLOYMENT_CHECKLIST.md)
- [Monitoring Configuration](./MONITORING_CONFIGURATION.md)
- [API Error Handling](./core/api.ts)
