# Monitoring & Error Tracking Configuration Guide

This guide provides detailed instructions for integrating production monitoring and error tracking with the Auctioner application.

## 📊 Current Monitoring Architecture

The application has built-in monitoring hooks in `core/api.ts`:

```typescript
// logError() - Called for all API errors
// logMetric() - Called for successful requests
// sendToMonitoring() - Placeholder for integration
```

---

## 🔧 Integration Options

### Option 1: Sentry (Recommended)

**Pros**: Comprehensive error tracking, performance monitoring, session replay
**Cons**: Additional dependency, pricing based on quota

#### Setup Steps

1. **Create Sentry Account**

   - Go to https://sentry.io
   - Create organization and project for "React"
   - Get your DSN: `https://<key>@o<id>.ingest.sentry.io/<project>`

2. **Install Package**

   ```bash
   npm install @sentry/react @sentry/tracing
   ```

3. **Initialize in main.tsx**

   ```typescript
   import React from "react";
   import ReactDOM from "react-dom/client";
   import * as Sentry from "@sentry/react";
   import { BrowserTracing } from "@sentry/tracing";
   import App from "./App.tsx";

   Sentry.init({
     dsn: import.meta.env.VITE_SENTRY_DSN,
     integrations: [
       new BrowserTracing(),
       new Sentry.Replay({
         maskAllText: true,
         blockAllMedia: true,
       }),
     ],
     environment: import.meta.env.MODE,
     tracesSampleRate: import.meta.env.MODE === "production" ? 0.1 : 1.0,
     replaysSessionSampleRate: 0.1,
     replaysOnErrorSampleRate: 1.0,
   });

   const root = ReactDOM.createRoot(document.getElementById("root")!);
   root.render(
     <React.StrictMode>
       <Sentry.ErrorBoundary fallback={<div>Something went wrong</div>}>
         <App />
       </Sentry.ErrorBoundary>
     </React.StrictMode>
   );
   ```

4. **Environment Variables (.env.production)**

   ```
   VITE_SENTRY_DSN=https://key@o123.ingest.sentry.io/456
   VITE_API_BASE=https://api.auctioner.example.com/api/v1
   ```

5. **Custom Error Reporting**
   Update `core/api.ts`:

   ```typescript
   import * as Sentry from "@sentry/react";

   function sendToMonitoring(logEntry: any) {
     if (import.meta.env.MODE === "production") {
       Sentry.captureMessage(
         `[${logEntry.type}] ${logEntry.context.message || logEntry.type}`,
         logEntry.level === "error" ? "error" : "warning"
       );
     }
   }
   ```

---

### Option 2: Custom Backend Logging Endpoint

**Pros**: Full control, no external dependencies, cost-effective
**Cons**: Requires backend implementation

#### Setup Steps

1. **Create Backend Logging Endpoint**

   ```python
   # Backend (FastAPI example)
   @app.post("/api/v1/logs")
   async def log_error(log_entry: dict):
       logger.error(f"[{log_entry['type']}] {log_entry}")
       # Store in database or ELK stack
       return {"status": "logged"}
   ```

2. **Update core/api.ts**

   ```typescript
   function sendToMonitoring(logEntry: any) {
     if (import.meta.env.MODE === "production") {
       fetch(`${API_BASE}/logs`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(logEntry),
       }).catch(() => {});
     }
   }
   ```

3. **Setup Logging Infrastructure**
   - Use ELK Stack (Elasticsearch, Logstash, Kibana) for log aggregation
   - Or: Use CloudWatch (AWS), Stackdriver (GCP), Azure Monitor (Azure)
   - Or: Use Splunk for enterprise-grade logging

---

### Option 3: AWS CloudWatch

**Pros**: Native AWS integration, cost-effective, good for AWS deployments
**Cons**: AWS-specific, less feature-rich than Sentry

#### Setup Steps

1. **Create CloudWatch Log Group**

   ```bash
   aws logs create-log-group --log-group-name /auctioner/frontend
   aws logs put-retention-policy --log-group-name /auctioner/frontend --retention-in-days 30
   ```

2. **Configure Frontend**

   ```typescript
   // Install AWS SDK
   npm install @aws-sdk/client-cloudwatch-logs

   // In core/api.ts
   import { CloudWatchLogsClient, PutLogEventsCommand } from "@aws-sdk/client-cloudwatch-logs";

   const cloudwatch = new CloudWatchLogsClient({
     credentials: {
       accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY,
       secretAccessKey: import.meta.env.VITE_AWS_SECRET_KEY,
     },
     region: 'us-east-1',
   });

   async function sendToMonitoring(logEntry: any) {
     try {
       await cloudwatch.send(new PutLogEventsCommand({
         logGroupName: '/auctioner/frontend',
         logStreamName: `${new Date().toISOString().split('T')[0]}-errors`,
         logEvents: [{
           timestamp: Date.now(),
           message: JSON.stringify(logEntry),
         }],
       }));
     } catch (e) {
       console.error('CloudWatch logging failed:', e);
     }
   }
   ```

3. **Environment Variables**
   ```
   VITE_AWS_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
   VITE_AWS_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
   ```

---

### Option 4: DataDog

**Pros**: Comprehensive APM, excellent visualizations, great for distributed systems
**Cons**: Higher pricing

#### Setup Steps

1. **Create DataDog Account**

   - Go to https://www.datadoghq.com
   - Create app and get API key

2. **Install Package**

   ```bash
   npm install @datadog/browser-rum @datadog/browser-logs
   ```

3. **Initialize in main.tsx**

   ```typescript
   import { datadogRum } from "@datadog/browser-rum";
   import { datadogLogs } from "@datadog/browser-logs";

   datadogRum.init({
     applicationId: import.meta.env.VITE_DD_APPLICATION_ID,
     clientToken: import.meta.env.VITE_DD_CLIENT_TOKEN,
     site: "datadoghq.com",
     service: "auctioner-frontend",
     env: import.meta.env.MODE,
     version: "1.0.0",
     sessionSampleRate: 100,
     sessionReplaySampleRate: 100,
     trackUserInteractions: true,
     trackResources: true,
     trackLongTasks: true,
     defaultPrivacyLevel: "mask-user-input",
   });

   datadogRum.startSessionReplayRecording();

   datadogLogs.init({
     clientToken: import.meta.env.VITE_DD_CLIENT_TOKEN,
     site: "datadoghq.com",
     forwardErrorsToLogs: true,
     sessionSampleRate: 100,
   });
   ```

4. **Custom Error Reporting**

   ```typescript
   import { datadogLogs } from "@datadog/browser-logs";

   function sendToMonitoring(logEntry: any) {
     datadogLogs.logger.log(logEntry, { type: logEntry.type });
   }
   ```

---

## 📈 Metrics to Track

### Error Metrics

- **Error Rate**: % of requests resulting in 4xx/5xx
- **Error Types**: Distribution of 401, 403, 429, 5xx
- **Error Frequency**: Errors per minute/hour
- **MTTR**: Mean Time To Recovery

### Performance Metrics

- **Response Time**: P50, P95, P99 latencies per endpoint
- **Request Rate**: Requests per second
- **Slow Requests**: % of requests > 5 seconds
- **Network Errors**: Connection failures, timeouts

### Business Metrics

- **Login Success Rate**: % of successful logins
- **API Endpoint Usage**: Calls per endpoint
- **Active Users**: Concurrent users
- **Session Duration**: Average session length

---

## 🚨 Alerting Rules

### Critical (Page On-Call)

```
Error Rate > 10% for 5 minutes
OR
5xx Error Rate > 5% for 5 minutes
OR
API Response Time P95 > 10 seconds
```

### High (Create Ticket)

```
Error Rate > 5% for 10 minutes
OR
Rate-Limit (429) > 100 per minute
OR
401 (Auth Failures) > 10 per minute
```

### Medium (Notify Team)

```
Error Rate > 2% for 15 minutes
OR
Slow Requests (> 5s) > 50 per minute
```

---

## 🔍 Debugging with Monitoring Data

### Investigation Workflow

1. **Alert Triggered** → Check monitoring dashboard
2. **Identify Pattern** → Which endpoint? Which user?
3. **Review Logs** → Get detailed error message
4. **Check Backend** → API logs, database logs
5. **Reproduce** → Try to reproduce locally
6. **Fix** → Implement fix
7. **Deploy** → Push to production
8. **Verify** → Monitor error rate drop

### Common Issues & Solutions

#### High 401 Rate

- Check token expiry settings
- Check HTTPS connectivity
- Review auth token generation logic
- Check browser storage for token

#### High 429 Rate

- Review rate-limit rules on backend
- Check for retry loops in frontend
- Implement exponential backoff
- Analyze traffic spike cause

#### High 5xx Rate

- Check backend logs
- Check database connectivity
- Check memory/CPU usage
- Check recent deployments

#### High Network Errors

- Check HTTPS certificate validity
- Check DNS resolution
- Review CORS configuration
- Check firewall rules

---

## 📊 Dashboard Setup

### Recommended Views

1. **Overview Dashboard**

   - Error rate over time
   - Response time trends
   - Top errors
   - User count

2. **Error Details Dashboard**

   - Error type breakdown
   - Error by endpoint
   - Error frequency
   - Stack traces

3. **Performance Dashboard**

   - Response time by endpoint
   - Slow requests
   - Request rate
   - Apdex score

4. **Business Dashboard**
   - Active users
   - Login success rate
   - API endpoint usage
   - Session duration

---

## 🔐 Security Considerations

### PII (Personally Identifiable Information)

⚠️ **DO NOT log**: Passwords, API keys, tokens, credit cards, SSNs

✅ **SAFE to log**: User IDs, endpoints, error messages, timestamps

```typescript
// GOOD
logError("LOGIN_FAILED", {
  userId: user.id,
  endpoint: "/login",
  status: 401,
});

// BAD - Don't log passwords!
logError("LOGIN_FAILED", {
  email: user.email,
  password: user.password, // ❌ NEVER
});
```

### Data Retention

- Error logs: 30 days
- Performance logs: 7 days
- Session replays: 30 days (if enabled)
- PII: Mask/redact in logs

---

## 🚀 Deployment Checklist

- [ ] Monitoring service account created
- [ ] API key/DSN configured in environment
- [ ] Monitoring package installed
- [ ] main.tsx initialized with monitoring
- [ ] core/api.ts sendToMonitoring() implemented
- [ ] Custom error reporting configured
- [ ] Alerts configured
- [ ] Dashboard created
- [ ] Team trained on monitoring tools
- [ ] On-call runbook updated

---

## 📚 Resources

- [Sentry Documentation](https://docs.sentry.io/product/alerts/)
- [DataDog Documentation](https://docs.datadoghq.com/integrations/)
- [AWS CloudWatch](https://docs.aws.amazon.com/cloudwatch/)
- [ELK Stack](https://www.elastic.co/what-is/elk-stack)
- [OpenTelemetry](https://opentelemetry.io/)
