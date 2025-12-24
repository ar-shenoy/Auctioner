import axios, { AxiosError, AxiosResponse } from 'axios';

// VITE_API_BASE MUST be set in environment - no hardcoded defaults allowed
const API_BASE = import.meta.env.VITE_API_BASE as string;

if (!API_BASE) {
  throw new Error(
    'API_BASE is not configured. Set VITE_API_BASE in .env or environment variables. '
    + 'Example: VITE_API_BASE=http://localhost:8000/api/v1'
  );
}

const IS_PRODUCTION = import.meta.env.MODE === 'production';

// ===== RATE LIMITING STATE =====
const rateLimitState = {
  isLimited: false,
  retryAfter: 0,
  requestsInWindow: 0,
  lastReset: Date.now(),
};

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// ===== REQUEST INTERCEPTOR: Attach token + HTTPS validation =====
api.interceptors.request.use((config) => {
  // HTTPS validation in production
  if (IS_PRODUCTION) {
    const baseUrl = config.baseURL || API_BASE;
    if (!baseUrl.startsWith('https')) {
      console.error('[SECURITY] Non-HTTPS API endpoint in production:', baseUrl);
      throw new Error('API endpoint must use HTTPS in production');
    }
  }

  // Attach JWT token
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  // Add request tracking for monitoring
  (config as any)._startTime = Date.now();
  (config as any)._retryCount = (config as any)._retryCount || 0;

  return config;
}, (error) => {
  // Request setup failed
  logError('REQUEST_SETUP_ERROR', {
    message: error.message,
    timestamp: new Date().toISOString(),
  });
  return Promise.reject(error);
});

// ===== RESPONSE INTERCEPTOR: Handle 401, 429, and errors =====
api.interceptors.response.use(
  (response) => {
    // Success - log request duration for monitoring
    const duration = Date.now() - (response.config as any)._startTime;
    logMetric('API_REQUEST_SUCCESS', {
      endpoint: response.config.url,
      method: response.config.method,
      duration,
      status: response.status,
    });
    return response;
  },
  (error: AxiosError) => {
    const response = error.response;
    const config = error.config as any;
    const duration = Date.now() - (config?._startTime || 0);

    // ===== 401 UNAUTHORIZED - TOKEN EXPIRED =====
    if (response?.status === 401) {
      logError('TOKEN_EXPIRED', {
        url: response.config?.url,
        timestamp: new Date().toISOString(),
      });

      // Clear token and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');

      // Redirect to login if not already there
      if (!window.location.pathname.includes('login')) {
        window.location.href = '/';
      }

      return Promise.reject(new Error('Session expired. Please log in again.'));
    }

    // ===== 403 FORBIDDEN - INSUFFICIENT PERMISSIONS =====
    if (response?.status === 403) {
      logError('FORBIDDEN', {
        url: response.config?.url,
        detail: (response.data as any)?.detail,
        timestamp: new Date().toISOString(),
      });

      return Promise.reject(
        new Error((response.data as any)?.detail || 'Access denied')
      );
    }

    // ===== 429 TOO MANY REQUESTS - RATE LIMITED =====
    if (response?.status === 429) {
      const retryAfter = parseInt(response.headers['retry-after'] || '60', 10);
      rateLimitState.isLimited = true;
      rateLimitState.retryAfter = retryAfter;

      logError('RATE_LIMITED', {
        url: response.config?.url,
        retryAfter,
        timestamp: new Date().toISOString(),
      });

      // For non-idempotent requests or critical operations, fail immediately
      const method = config?.method?.toUpperCase();
      const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method || '');

      if (isMutation) {
        // Mutations (POST, PUT, DELETE) must fail - don't retry
        return Promise.reject(
          new Error(
            `Too many requests. Please wait ${retryAfter} seconds before trying again.`
          )
        );
      }

      // For GET requests, we could implement exponential backoff (but keep it simple)
      // For now, fail immediately and let UI show the error
      return Promise.reject(
        new Error(
          `Server is busy. Please wait ${retryAfter} seconds before trying again.`
        )
      );
    }

    // ===== 5xx SERVER ERROR =====
    if (response?.status && response.status >= 500) {
      logError('SERVER_ERROR', {
        url: response.config?.url,
        status: response.status,
        detail: (response.data as any)?.detail,
        timestamp: new Date().toISOString(),
      });

      return Promise.reject(
        new Error('Server error. Please contact support if this persists.')
      );
    }

    // ===== 4xx CLIENT ERROR (4xx excluding handled above) =====
    if (response?.status && response.status >= 400 && response.status < 500) {
      logError('CLIENT_ERROR', {
        url: response.config?.url,
        status: response.status,
        detail: (response.data as any)?.detail,
        timestamp: new Date().toISOString(),
      });

      // Return error with detail from backend
      return Promise.reject(error);
    }

    // ===== NETWORK ERROR =====
    if (!response) {
      logError('NETWORK_ERROR', {
        url: config?.url,
        message: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      });

      if (error.code === 'ECONNABORTED') {
        return Promise.reject(new Error('Request timeout. Please check your connection.'));
      }

      return Promise.reject(
        new Error('Network error. Please check your internet connection.')
      );
    }

    // ===== UNKNOWN ERROR =====
    logError('UNKNOWN_ERROR', {
      url: config?.url,
      message: error.message,
      timestamp: new Date().toISOString(),
    });

    return Promise.reject(error);
  }
);

// ===== MONITORING HOOKS =====
function logError(
  errorType: string,
  context: Record<string, any>
) {
  const logEntry = {
    level: 'error',
    type: errorType,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  // Console log in development
  if (!IS_PRODUCTION) {
    console.error(`[${errorType}]`, context);
  }

  // Send to monitoring service in production
  if (IS_PRODUCTION) {
    sendToMonitoring(logEntry);
  }
}

function logMetric(
  metricType: string,
  data: Record<string, any>
) {
  if (!IS_PRODUCTION) {
    console.log(`[${metricType}]`, data);
  }

  // Send to monitoring service in production (optional)
  if (IS_PRODUCTION && data.duration > 5000) {
    // Only send slow requests to avoid log spam
    sendToMonitoring({
      level: 'warn',
      type: 'SLOW_REQUEST',
      data,
      timestamp: new Date().toISOString(),
    });
  }
}

function sendToMonitoring(logEntry: any) {
  // Placeholder for monitoring service integration
  // In production, this could send to:
  // - Sentry
  // - DataDog
  // - CloudWatch
  // - Custom backend logging endpoint
  try {
    // Example: Send to custom logging endpoint
    // fetch('/api/v1/logs', { method: 'POST', body: JSON.stringify(logEntry) })
  } catch (e) {
    // Fail silently - don't let logging break the app
  }
}

export default api;

export function setAccessToken(token: string | null) {
  if (token) {
    localStorage.setItem('access_token', token);
  } else {
    localStorage.removeItem('access_token');
  }
}

export function isRateLimited(): boolean {
  return rateLimitState.isLimited;
}

export function getRateLimitRetryAfter(): number {
  return rateLimitState.retryAfter;
}
