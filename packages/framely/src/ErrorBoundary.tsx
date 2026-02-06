import { Component, ReactNode, ErrorInfo } from 'react';

/**
 * Error boundary for catching render errors in compositions.
 *
 * In render mode, sets window.__FRAMELY_RENDER_ERROR so the CLI
 * can detect and report the error.
 *
 * In dev/studio mode, displays the error with a stack trace.
 */

declare global {
  interface Window {
    __FRAMELY_RENDER_ERROR?: {
      message: string;
      stack?: string;
      componentStack?: string | null;
    };
  }
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // In render mode, expose the error for CLI detection
    if (typeof window !== 'undefined') {
      window.__FRAMELY_RENDER_ERROR = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
      };

      // Dispatch custom event for render pipeline
      window.dispatchEvent(
        new CustomEvent('framely-render-error', {
          detail: { error, errorInfo },
        }),
      );
    }

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // In render mode, show nothing (error is on window)
      const params = new URLSearchParams(
        typeof window !== 'undefined' ? window.location.search : '',
      );
      if (params.get('renderMode') === 'true') {
        return null;
      }

      // Dev/studio mode - show error details
      return (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#1a1a1a',
            color: '#ef4444',
            fontFamily: 'system-ui, sans-serif',
            padding: '24px',
          }}
        >
          <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
            Composition Error
          </div>
          <div
            style={{
              fontSize: '14px',
              color: '#fff',
              marginBottom: '16px',
              textAlign: 'center',
              maxWidth: '600px',
            }}
          >
            {this.state.error?.message || 'An unknown error occurred'}
          </div>
          {this.state.error?.stack && (
            <pre
              style={{
                fontSize: '11px',
                color: '#888',
                background: '#111',
                padding: '12px',
                borderRadius: '6px',
                maxWidth: '80%',
                maxHeight: '200px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {this.state.error.stack}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
