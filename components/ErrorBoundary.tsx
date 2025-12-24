import React, { ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

const isDev = () => (import.meta as any).env?.MODE !== 'production';

/**
 * Error Boundary Component
 * 
 * Catches unexpected errors in the component tree and displays a user-friendly error page.
 * Prevents complete app crashes and logs errors for monitoring.
 * 
 * Does NOT catch:
 * - Event handler errors (use try-catch)
 * - Async code errors (use try-catch)
 * - Server-side rendering errors
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  props!: ErrorBoundaryProps;
  state!: ErrorBoundaryState;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so next render shows fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for monitoring
    const logEntry = {
      level: 'error',
      type: 'ERROR_BOUNDARY_CAUGHT',
      error: {
        message: error.message,
        stack: error.stack,
      },
      errorInfo,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    };

    // Log to console in development
    if (isDev()) {
      console.error('[ERROR_BOUNDARY]', logEntry);
    }

    // Send to monitoring in production
    try {
      if (!isDev()) {
        // Placeholder for sending to monitoring service
        // fetch('/api/v1/logs', { method: 'POST', body: JSON.stringify(logEntry) })
      }
    } catch (e) {
      // Fail silently
    }

    // Increment error count
    (this as any).setState((prevState: ErrorBoundaryState) => ({
      errorCount: prevState.errorCount + 1,
    }));
  }

  handleReset = () => {
    (this as any).setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-800 rounded-xl border border-gray-700 shadow-lg p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Something Went Wrong
              </h1>
              <p className="text-gray-400 mb-6">
                An unexpected error occurred. Please try refreshing the page.
              </p>

              {isDev() && this.state.error && (
                <div className="mb-6 p-4 bg-red-900/30 border border-red-600/50 rounded text-left">
                  <p className="text-red-300 text-xs font-mono break-words">
                    {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <details className="mt-2 text-xs text-red-300">
                      <summary className="cursor-pointer">Stack Trace</summary>
                      <pre className="mt-2 overflow-auto text-xs whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition-colors"
                >
                  Refresh Page
                </button>
                <button
                  onClick={() => (window.location.href = '/')}
                  className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded transition-colors"
                >
                  Go Home
                </button>
              </div>

              {this.state.errorCount > 2 && (
                <p className="text-xs text-gray-500 mt-4">
                  Multiple errors detected. Please contact support if this persists.
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

