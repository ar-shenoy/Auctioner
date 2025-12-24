# System Architecture & Component Guide

Visual reference for understanding how all components work together.

---

## 🏗️ Complete Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AUCTIONER FRONTEND                           │
│                       (React + TypeScript)                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │    React Component Tree      │
              │   (Pages, Components, etc)   │
              └────────────┬─────────────────┘
                           │
          Error during lifecycle or render?
                           │
                    ┌──────▼───────┐
                    │ Error occurs │
                    └──────┬───────┘
                           │
            ┌──────────────┴──────────────┐
            ▼                             ▼
     Caught by Error Boundary     Event Handler or Async
     (component tree errors)      (use try-catch)
            │                             │
            ▼                             ▼
  ┌──────────────────────┐  ┌──────────────────────┐
  │ ErrorBoundary.tsx    │  │ API Call in core/api │
  │ - Catch error        │  │ - Request sent       │
  │ - Show UI            │  │ - Response received  │
  │ - Log to monitoring  │  │ - Handler check code │
  └──────────────────────┘  └──────────────────────┘
            │                             │
            │          ┌──────────────────┘
            │          │
            ▼          ▼
  ┌────────────────────────────────────────────┐
  │   core/api.ts - Response Interceptor       │
  │                                            │
  │   Status Code Router:                      │
  │   ├─ 2xx ─► Return data (success)         │
  │   ├─ 400 ─► Show validation error         │
  │   ├─ 401 ─► Logout + redirect to login    │
  │   ├─ 403 ─► Show permission denied        │
  │   ├─ 404 ─► Show not found                │
  │   ├─ 429 ─► Show rate limit message       │
  │   ├─ 5xx ─► Show server error             │
  │   └─ Network ─► Show connection error     │
  │                                            │
  │   All errors logged:                       │
  │   └─► logError() ──► sendToMonitoring()   │
  │                                            │
  │   Success logged:                          │
  │   └─► logMetric() ──► sendToMonitoring()  │
  └────────────────────────────────────────────┘
            │
            ▼
  ┌────────────────────────────────┐
  │  sendToMonitoring()            │
  │  (Integration Point)           │
  │                                │
  │  Supports:                     │
  │  - Sentry                      │
  │  - DataDog                     │
  │  - CloudWatch                  │
  │  - Custom backend endpoint     │
  │  - Fail silently if error      │
  └────────────────────────────────┘
            │
            ▼
  ┌────────────────────────────────┐
  │   Monitoring Service           │
  │                                │
  │   - Error Tracking             │
  │   - Performance Metrics        │
  │   - Alerting                   │
  │   - Dashboards                 │
  │   - Session Replay (optional)  │
  └────────────────────────────────┘

```

---

## 📁 File Organization

```
Auctioner/
├── Core API & Auth
│   ├── core/api.ts ..................... API client + error handling
│   ├── core/auth.ts .................... Token management
│   └── core/db.ts ...................... Database client
│
├── Components
│   ├── ErrorBoundary.tsx ............... Global error catching
│   ├── Sidebar.tsx, etc ................ UI components
│   └── icons/ .......................... Icon components
│
├── Pages
│   ├── Dashboard.tsx, etc .............. Page components
│   └── Login.tsx ....................... Auth page
│
├── Production Documentation ⭐
│   ├── FINAL_SUMMARY.md ................ This summary
│   ├── QUICK_REFERENCE.md .............. Emergency guide
│   ├── HARDENING_SUMMARY.md ............ What was done
│   ├── PRODUCTION_DEPLOYMENT_CHECKLIST.md . Pre-deploy checks
│   ├── ERROR_HANDLING_RUNBOOK.md ....... Incident procedures
│   ├── MONITORING_CONFIGURATION.md ..... Setup guide
│   ├── API_ERROR_RESPONSE_SPEC.md ...... Backend spec
│   ├── DOCUMENTATION_INDEX.md .......... Navigation
│   └── ARCHITECTURE.md (this file)
│
└── Other Files
    ├── App.tsx
    ├── index.tsx
    ├── types.ts
    ├── constants.ts
    ├── package.json
    └── vite.config.ts
```

---

## 🔄 Request/Response Flow

### Happy Path (Success)

```
User Action
    │
    ▼
API Call: api.get('/api/v1/players')
    │
    ├─► Request Interceptor
    │   ├─ Attach JWT token
    │   ├─ HTTPS validation (production)
    │   └─ Start time tracking
    │
    ▼
HTTP Request sent to backend
    │
    ▼
Backend processes request
    │
    ▼
Response: 200 OK with data
    │
    ├─► Response Interceptor
    │   ├─ Check status (2xx)
    │   ├─ Calculate duration
    │   └─ Log metric via logMetric()
    │
    ▼
Return Promise<data>
    │
    ▼
Component receives data
    │
    ▼
Update UI with new data
    │
    ▼
✅ Success!
```

### Error Path (401 - Token Expired)

```
User Action
    │
    ▼
API Call: api.get('/api/v1/players')
    │
    ├─► Request Interceptor
    │   ├─ Attach JWT token
    │   └─ Start time tracking
    │
    ▼
HTTP Request sent to backend
    │
    ▼
Backend validation fails
    │
    ▼
Response: 401 Unauthorized
    │
    ├─► Response Interceptor
    │   ├─ Check status (401)
    │   ├─ Log error via logError()
    │   ├─ Clear localStorage token
    │   ├─ Clear localStorage user
    │   └─ Redirect to home (login page)
    │
    ▼
Return Promise.reject(error)
    │
    ▼
User sees login page
    │
    ▼
✅ Error handled gracefully!
```

### Error Path (429 - Rate Limited)

```
User Action (rapid clicks)
    │
    ▼
API Call: api.post('/api/v1/teams', {...})
    │
    ├─► Request Interceptor
    │   └─ Start time tracking
    │
    ▼
HTTP Request sent to backend
    │
    ▼
Backend rate limit check
    │
    ▼
Response: 429 Too Many Requests
    Headers: Retry-After: 60
    │
    ├─► Response Interceptor
    │   ├─ Check status (429)
    │   ├─ Log error with retry info
    │   ├─ Check method (POST = mutation)
    │   ├─ DON'T retry (prevent data corruption)
    │   └─ Return error message
    │
    ▼
Return Promise.reject(error)
    │
    ▼
UI Error Handler catches error
    │
    ▼
Show: "Too many requests. Wait 60 seconds."
    │
    ▼
User can click "Retry" button after 60s
    │
    ▼
✅ Rate limited without breaking!
```

### Error Path (Uncaught Component Error)

```
React Component
    │
    ▼
Rendering JSX
    │
    ▼
Error in render (e.g., null.property)
    │
    ▼
Error propagates up component tree
    │
    ▼
ErrorBoundary.tsx catches it
    │
    ├─► React Error Boundary
    │   ├─ Stop rendering
    │   ├─ State: hasError = true
    │   ├─ Log error via componentDidCatch()
    │   └─ Call sendToMonitoring()
    │
    ▼
ErrorBoundary.render() returns fallback UI
    │
    ├─ Error message: "Something Went Wrong"
    ├─ Error details (dev mode only)
    ├─ "Refresh Page" button
    └─ "Go Home" button
    │
    ▼
User clicks "Refresh Page"
    │
    ▼
Page reloads, hopefully error is fixed
    │
    ▼
✅ App didn't crash!
```

---

## 📊 Error Handling Decision Tree

```
                        API Response
                             │
                    ┌────────┴─────────┐
                    │                  │
                  Success?           No
                    │                  │
                   Yes                 ▼
                    │            Status Code?
                    │
                    │    ┌──────┬───────┬──────┬──────┬────┐
                    │    │      │       │      │      │    │
                    │   400   401    403    404   429   5xx Others
                    │    │      │       │      │      │    │
                    ▼    ▼      ▼       ▼      ▼      ▼    ▼
              Return   Show   Logout  Show   Show   Show  Show
              Data   Validation Redirect Error Retry Server Network
                      Error   to Login        Error  Error  Error

                       │      │       │      │      │      │
                       └──────┴───────┴──────┴──────┴──────┘
                             │
                    ┌────────▼─────────┐
                    │  logError()      │
                    │  (if applicable) │
                    └────────┬─────────┘
                             │
                    ┌────────▼──────────────┐
                    │  sendToMonitoring()   │
                    │  (in production)      │
                    └──────────────────────┘
                             │
                    ┌────────▼──────────────┐
                    │  Monitoring Service   │
                    │  (Sentry/DataDog/etc) │
                    └──────────────────────┘
```

---

## 🔐 Security Layers

```
┌──────────────────────────────────────────────────┐
│         User Browser (Frontend)                  │
│  ┌────────────────────────────────────────────┐  │
│  │ React App                                  │  │
│  │ - Error Boundary catches crashes          │  │
│  │ - No sensitive data in localStorage       │  │
│  │ - Tokens cleared on logout                │  │
│  └────────────────────┬───────────────────────┘  │
│                       │                          │
│                       ▼                          │
│  ┌────────────────────────────────────────────┐  │
│  │ core/api.ts - Request Interceptor         │  │
│  │ - HTTPS validation (production)           │  │
│  │ - JWT token attachment                    │  │
│  │ - Request signing/tracking                │  │
│  └────────────────────┬───────────────────────┘  │
│                       │                          │
│                       ▼                          │
│  ┌────────────────────────────────────────────┐  │
│  │ HTTPS Encrypted Tunnel                    │  │
│  │ - TLS 1.2+ encryption                     │  │
│  │ - Certificate validation                  │  │
│  │ - No data in plain text                   │  │
│  └────────────────────┬───────────────────────┘  │
│                       │                          │
│                       ▼                          │
│  ┌────────────────────────────────────────────┐  │
│  │ core/api.ts - Response Interceptor        │  │
│  │ - Status code validation                  │  │
│  │ - Error message sanitization              │  │
│  │ - 401: Token expiry handling              │  │
│  │ - 403: Permission validation              │  │
│  │ - No sensitive data in errors             │  │
│  └────────────────────┬───────────────────────┘  │
│                       │                          │
└───────────────────────┼──────────────────────────┘
                        │
                        ▼
            ┌───────────────────────────┐
            │  Backend (Your Server)    │
            │ - Validate JWT token      │
            │ - Check permissions       │
            │ - Access database         │
            │ - Return data or error    │
            └───────────────────────────┘
```

---

## 📈 Monitoring Integration Points

```
┌─────────────────────────────────────────┐
│      core/api.ts Monitoring Hooks       │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
   logError()             logMetric()
        │                       │
        ├─ Error type          ├─ Endpoint
        ├─ Status code         ├─ Method
        ├─ URL                 ├─ Duration
        ├─ Detail              ├─ Status
        ├─ Timestamp           └─ Timestamp
        └─ Request ID
                    │                       │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼────────────┐
                    │ sendToMonitoring()     │
                    │ (Integration Point)    │
                    └───────────┬────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            │                   │                   │
            ▼                   ▼                   ▼
         Sentry            DataDog            Custom/
        (with DSN)      (with API Key)       CloudWatch
            │                   │                   │
            └───────────┬───────┴───────┬──────────┘
                        │               │
                        ▼               ▼
                    Dashboard      Error Tracking
                        │               │
                        └───┬───────────┘
                            │
                            ▼
                        Alerts/Alarms
                            │
                            ▼
                        Pagerduty/Slack
                            │
                            ▼
                        On-Call Engineer
```

---

## 🔄 Request Lifecycle Detail

### Phase 1: Request Creation

```javascript
const response = api.get('/api/v1/players');
                ↓
            axios.request()
                ↓
        Request Interceptor runs
                ↓
        Check HTTPS (production)
                ↓
        Attach JWT token
                ↓
        Store start time
```

### Phase 2: Network Transmission

```
Request → HTTPS encrypted → Network → Server received
```

### Phase 3: Server Processing

```
Backend receives request
    ↓
Validate JWT token
    ↓
Check permissions
    ↓
Process request
    ↓
Generate response + status code
    ↓
Return response
```

### Phase 4: Response Handling

```javascript
Response received
    ↓
Response Interceptor runs
    ↓
Check status code (2xx? 4xx? 5xx?)
    ↓
Calculate request duration
    ↓
Route to handler:
├─ 2xx → logMetric() → return data
├─ 401 → logError() → logout & redirect
├─ 403 → logError() → reject with message
├─ 429 → logError() → reject with retry info
├─ 5xx → logError() → reject with message
└─ Network error → logError() → reject
    ↓
sendToMonitoring() (if error)
    ↓
Return Promise (resolved or rejected)
```

### Phase 5: UI Update

```javascript
.then(data => {
    // Handle success
    // Update state
    // Render UI
})
.catch(error => {
    // Handle error
    // Show error message
    // OR Error Boundary catches it
})
```

---

## 🎯 Component Interaction Map

```
┌──────────────────────────────────────────┐
│            App.tsx (Main)                │
│  ┌──────────────────────────────────────┐│
│  │  ErrorBoundary (Global catch)        ││
│  │  ┌────────────────────────────────┐  ││
│  │  │ Page Component (Dashboard, etc)│  ││
│  │  │  ┌──────────────────────────┐  │  ││
│  │  │  │ useEffect                │  │  ││
│  │  │  │ api.get() ──┐            │  │  ││
│  │  │  └─────────────┼────────────┘  │  ││
│  │  └────────────────┼────────────────┘  ││
│  └───────────────────┼──────────────────┘│
└──────────────────────┼──────────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │   core/api.ts        │
            │  ┌────────────────┐  │
            │  │ Request        │  │
            │  │ Interceptor    │  │
            │  └────────────────┘  │
            │  ┌────────────────┐  │
            │  │ Response       │  │
            │  │ Interceptor    │  │
            │  └────────────────┘  │
            │  ┌────────────────┐  │
            │  │ Error Handlers │  │
            │  │ (401, 429,etc) │  │
            │  └────────────────┘  │
            │  ┌────────────────┐  │
            │  │ Monitoring     │  │
            │  │ Hooks          │  │
            │  └────────────────┘  │
            └──────────────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │  core/auth.ts        │
            │  - Login             │
            │  - Logout            │
            │  - Token mgmt        │
            └──────────────────────┘
```

---

## 📊 Error Coverage Matrix

```
                  Frontend Handled?    Logged?    Monitored?
                  ═════════════════    ══════    ═══════════
401 Unauthorized      ✅ Yes           ✅ Yes      ✅ Yes
403 Forbidden         ✅ Yes           ✅ Yes      ✅ Yes
404 Not Found         ✅ Yes*          ✅ Yes      ✅ Yes
409 Conflict          ✅ Yes*          ✅ Yes      ✅ Yes
429 Rate Limited      ✅ Yes           ✅ Yes      ✅ Yes
500+ Server Error     ✅ Yes           ✅ Yes      ✅ Yes
Timeout               ✅ Yes           ✅ Yes      ✅ Yes
Connection Failed     ✅ Yes           ✅ Yes      ✅ Yes
Component Error       ✅ Yes (EB)      ✅ Yes      ✅ Yes
Validation Error      ✅ Yes*          ✅ Yes      ✅ Yes

* Depends on component implementation
EB = Error Boundary catches it
```

---

## 🔗 Cross-Reference Guide

| Want to know about...      | Check this file                                |
| -------------------------- | ---------------------------------------------- |
| What error means           | QUICK_REFERENCE.md - Quick Reference table     |
| How to fix it              | ERROR_HANDLING_RUNBOOK.md - Find incident type |
| What backend should return | API_ERROR_RESPONSE_SPEC.md                     |
| How to setup monitoring    | MONITORING_CONFIGURATION.md                    |
| Before deploying           | PRODUCTION_DEPLOYMENT_CHECKLIST.md             |
| How everything works       | HARDENING_SUMMARY.md - Architecture            |
| Emergency response         | QUICK_REFERENCE.md - Emergency section         |
| Finding anything           | DOCUMENTATION_INDEX.md                         |

---

## ✅ Implementation Checklist

| Component              | Status   | File              | Notes                           |
| ---------------------- | -------- | ----------------- | ------------------------------- |
| Request interceptor    | ✅ Done  | core/api.ts       | Attaches token, validates HTTPS |
| 401 handler            | ✅ Done  | core/api.ts       | Logs out, redirects             |
| 403 handler            | ✅ Done  | core/api.ts       | Shows error message             |
| 429 handler            | ✅ Done  | core/api.ts       | Shows retry time                |
| 5xx handler            | ✅ Done  | core/api.ts       | Shows generic message           |
| Network error handler  | ✅ Done  | core/api.ts       | Shows connection error          |
| Error logging          | ✅ Done  | core/api.ts       | logError() function             |
| Metric logging         | ✅ Done  | core/api.ts       | logMetric() function            |
| Monitoring integration | ✅ Ready | core/api.ts       | sendToMonitoring()              |
| Error boundary         | ✅ Done  | ErrorBoundary.tsx | Catches component errors        |
| Token management       | ✅ Done  | core/auth.ts      | Clear on logout/401             |
| Documentation          | ✅ Done  | 7 files           | Complete guides                 |
