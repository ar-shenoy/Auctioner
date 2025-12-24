# API Error Response Specification

This document specifies how the backend API should return error responses for the frontend to handle properly.

---

## Standard Error Response Format

All error responses should follow this format:

```json
{
  "detail": "User-friendly error message",
  "error_type": "ERROR_CODE",
  "error_code": 123,
  "timestamp": "2024-01-15T14:30:00Z",
  "request_id": "req_abc123xyz",
  "path": "/api/v1/players",
  "method": "GET"
}
```

### Field Descriptions

| Field        | Type    | Required | Description                                |
| ------------ | ------- | -------- | ------------------------------------------ |
| `detail`     | string  | ✅ Yes   | Human-readable error message for end users |
| `error_type` | string  | ✅ Yes   | Machine-readable error type code           |
| `error_code` | integer | ❌ No    | Numeric error code for categorization      |
| `timestamp`  | string  | ✅ Yes   | ISO 8601 timestamp when error occurred     |
| `request_id` | string  | ✅ Yes   | Unique ID for tracing request              |
| `path`       | string  | ❌ No    | Request path that caused error             |
| `method`     | string  | ❌ No    | HTTP method (GET, POST, etc.)              |

---

## HTTP Status Codes & Response Examples

### 400 - Bad Request

**When**: Invalid request parameters, validation error

```json
{
  "detail": "Invalid email format",
  "error_type": "VALIDATION_ERROR",
  "error_code": 400,
  "timestamp": "2024-01-15T14:30:00Z",
  "request_id": "req_abc123xyz",
  "path": "/api/v1/users",
  "method": "POST"
}
```

**Frontend Handling** (in `core/api.ts`):

```typescript
if (response?.status === 400) {
  // Show validation error to user
  toast.error(response.data?.detail || "Invalid request");
}
```

---

### 401 - Unauthorized

**When**: Invalid/expired token, not authenticated

```json
{
  "detail": "Token expired. Please log in again.",
  "error_type": "TOKEN_EXPIRED",
  "error_code": 401,
  "timestamp": "2024-01-15T14:30:00Z",
  "request_id": "req_abc123xyz"
}
```

**Frontend Handling** (in `core/api.ts` - ALREADY IMPLEMENTED):

```typescript
if (response?.status === 401) {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
  window.location.href = "/";
  return Promise.reject(new Error("Session expired. Please log in again."));
}
```

---

### 403 - Forbidden

**When**: User lacks permission, insufficient role

```json
{
  "detail": "Only admins can delete teams",
  "error_type": "INSUFFICIENT_PERMISSIONS",
  "error_code": 403,
  "timestamp": "2024-01-15T14:30:00Z",
  "request_id": "req_abc123xyz",
  "path": "/api/v1/teams/123",
  "method": "DELETE"
}
```

**Frontend Handling** (in `core/api.ts` - ALREADY IMPLEMENTED):

```typescript
if (response?.status === 403) {
  return Promise.reject(new Error(response.data?.detail || "Access denied"));
}
```

---

### 404 - Not Found

**When**: Resource doesn't exist

```json
{
  "detail": "Player with ID 999 not found",
  "error_type": "NOT_FOUND",
  "error_code": 404,
  "timestamp": "2024-01-15T14:30:00Z",
  "request_id": "req_abc123xyz",
  "path": "/api/v1/players/999",
  "method": "GET"
}
```

---

### 409 - Conflict

**When**: Data conflict (e.g., duplicate, state mismatch)

```json
{
  "detail": "Email already registered",
  "error_type": "CONFLICT",
  "error_code": 409,
  "timestamp": "2024-01-15T14:30:00Z",
  "request_id": "req_abc123xyz",
  "path": "/api/v1/users",
  "method": "POST"
}
```

---

### 429 - Too Many Requests

**When**: Rate limit exceeded

```json
{
  "detail": "Too many requests. Please try again in 60 seconds.",
  "error_type": "RATE_LIMIT_EXCEEDED",
  "error_code": 429,
  "timestamp": "2024-01-15T14:30:00Z",
  "request_id": "req_abc123xyz",
  "retry_after": 60
}
```

**IMPORTANT Headers**:

- `Retry-After: 60` (in seconds)

**Frontend Handling** (in `core/api.ts` - ALREADY IMPLEMENTED):

```typescript
if (response?.status === 429) {
  const retryAfter = parseInt(response.headers["retry-after"] || "60", 10);
  return Promise.reject(
    new Error(
      `Too many requests. Please wait ${retryAfter} seconds before trying again.`
    )
  );
}
```

---

### 500 - Internal Server Error

**When**: Unhandled backend error

```json
{
  "detail": "Internal server error. Please contact support.",
  "error_type": "INTERNAL_SERVER_ERROR",
  "error_code": 500,
  "timestamp": "2024-01-15T14:30:00Z",
  "request_id": "req_abc123xyz"
}
```

**⚠️ IMPORTANT**: Never expose internal error details to frontend!

**BAD (exposes implementation details)**:

```json
{
  "detail": "Traceback: line 42 in models.py - KeyError 'user_id'"
}
```

**GOOD (hides implementation, helps debugging)**:

```json
{
  "detail": "Internal server error. Please contact support with request ID: req_abc123xyz"
}
```

**Frontend Handling** (in `core/api.ts` - ALREADY IMPLEMENTED):

```typescript
if (response?.status >= 500) {
  logError("SERVER_ERROR", {
    url: response.config?.url,
    status: response.status,
  });
  return Promise.reject(
    new Error("Server error. Please contact support if this persists.")
  );
}
```

---

### 503 - Service Unavailable

**When**: Server temporarily down for maintenance

```json
{
  "detail": "Server is temporarily unavailable. We'll be back soon.",
  "error_type": "SERVICE_UNAVAILABLE",
  "error_code": 503,
  "timestamp": "2024-01-15T14:30:00Z",
  "retry_after": 300
}
```

**Headers**:

- `Retry-After: 300` (in seconds)
- `X-RateLimit-Reset: 1609459200` (Unix timestamp)

---

## Success Response Format

All successful responses should follow this format:

```json
{
  "data": { ... },
  "message": "Operation successful"
}
```

OR (for list endpoints):

```json
{
  "data": [ ... ],
  "total": 10,
  "page": 1,
  "per_page": 20,
  "message": "Records retrieved successfully"
}
```

### Examples

**GET /api/v1/players**

```json
{
  "data": [
    { "id": 1, "name": "Player 1", "team_id": 1 },
    { "id": 2, "name": "Player 2", "team_id": 2 }
  ],
  "total": 2,
  "page": 1,
  "per_page": 20
}
```

**POST /api/v1/players**

```json
{
  "data": {
    "id": 3,
    "name": "New Player",
    "team_id": 1
  },
  "message": "Player created successfully"
}
```

---

## Backend Implementation Examples

### FastAPI (Python)

```python
from fastapi import FastAPI, HTTPException, status
from datetime import datetime
import uuid

app = FastAPI()

@app.get("/api/v1/players/{player_id}")
async def get_player(player_id: int):
    player = db.query(Player).get(player_id)

    if not player:
        raise HTTPException(
            status_code=404,
            detail="Player not found",
            headers={"X-Request-ID": str(uuid.uuid4())},
        )

    return {
        "data": player,
        "message": "Player retrieved successfully"
    }

@app.post("/api/v1/players")
async def create_player(player: PlayerCreate):
    # Validate
    if not is_valid_email(player.email):
        raise HTTPException(
            status_code=400,
            detail="Invalid email format",
        )

    # Check duplicate
    existing = db.query(Player).filter_by(email=player.email).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail="Email already registered",
        )

    # Create
    new_player = Player(**player.dict())
    db.add(new_player)
    db.commit()

    return {
        "data": new_player,
        "message": "Player created successfully"
    }

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return {
        "detail": exc.detail,
        "error_type": "HTTP_ERROR",
        "error_code": exc.status_code,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "request_id": request.state.request_id,
        "path": str(request.url.path),
        "method": request.method,
    }

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    # Don't expose internal error details!
    return {
        "detail": "Internal server error. Please contact support.",
        "error_type": "INTERNAL_SERVER_ERROR",
        "error_code": 500,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "request_id": request.state.request_id,
    }
```

---

### Express.js (Node.js)

```javascript
app.get("/api/v1/players/:playerId", async (req, res) => {
  const { playerId } = req.params;

  const player = await Player.findById(playerId);

  if (!player) {
    return res.status(404).json({
      detail: "Player not found",
      error_type: "NOT_FOUND",
      error_code: 404,
      timestamp: new Date().toISOString(),
      request_id: req.id,
      path: req.path,
      method: req.method,
    });
  }

  res.json({
    data: player,
    message: "Player retrieved successfully",
  });
});

app.post("/api/v1/players", async (req, res) => {
  const { name, email } = req.body;

  // Validate
  if (!isValidEmail(email)) {
    return res.status(400).json({
      detail: "Invalid email format",
      error_type: "VALIDATION_ERROR",
      error_code: 400,
      timestamp: new Date().toISOString(),
      request_id: req.id,
    });
  }

  // Check duplicate
  const existing = await Player.findOne({ email });
  if (existing) {
    return res.status(409).json({
      detail: "Email already registered",
      error_type: "CONFLICT",
      error_code: 409,
      timestamp: new Date().toISOString(),
      request_id: req.id,
    });
  }

  // Create
  const player = new Player({ name, email });
  await player.save();

  res.status(201).json({
    data: player,
    message: "Player created successfully",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("[ERROR]", err);

  // Don't expose internal error details!
  res.status(500).json({
    detail: "Internal server error. Please contact support.",
    error_type: "INTERNAL_SERVER_ERROR",
    error_code: 500,
    timestamp: new Date().toISOString(),
    request_id: req.id,
  });
});
```

---

## Testing Error Responses

### Manual Testing

```bash
# Test 400 - Bad Request
curl -X POST https://api.auctioner.example.com/api/v1/players \
  -H "Content-Type: application/json" \
  -d '{"name": "invalid"}'  # Missing email
# Expected: 400 with "Invalid email format"

# Test 401 - Unauthorized
curl -H "Authorization: Bearer invalid" \
  https://api.auctioner.example.com/api/v1/players
# Expected: 401 with "Token expired"

# Test 403 - Forbidden (non-admin user)
curl -H "Authorization: Bearer $TOKEN" \
  -X DELETE https://api.auctioner.example.com/api/v1/teams/1
# Expected: 403 with "Only admins can delete teams"

# Test 429 - Rate Limited
for i in {1..101}; do
  curl https://api.auctioner.example.com/api/v1/players &
done
# Expected: 100 requests succeed, 101st fails with 429
```

---

## Frontend Integration Verification

The frontend already handles all these cases in [core/api.ts](./core/api.ts):

- ✅ 401 → Clear token, redirect to login
- ✅ 403 → Show "Access denied" message
- ✅ 429 → Show "Too many requests" with retry info
- ✅ 5xx → Show "Server error" message
- ✅ Network error → Show "Connection error" message

**Verify** by running the application and testing each error case manually.

---

## Checklist for Backend Team

Before deploying to production:

- [ ] All error responses include `detail`, `error_type`, `timestamp`, `request_id`
- [ ] 401 responses don't expose token details
- [ ] 403 responses explain why access was denied
- [ ] 429 responses include `Retry-After` header
- [ ] 500 errors don't expose stack traces or internal details
- [ ] All validation errors are descriptive
- [ ] Duplicate/conflict errors clearly explain the issue
- [ ] Not found errors identify the missing resource
- [ ] Success responses follow consistent format
- [ ] All error cases tested and working
