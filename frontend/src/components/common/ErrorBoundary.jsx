import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div className="card" style={{ maxWidth: '520px', width: '100%', textAlign: 'center', padding: '36px' }}>
            <span className="material-icons" style={{ fontSize: '48px', color: 'var(--accent-orange, #f59e0b)', marginBottom: '16px' }}>
              warning
            </span>
            <h2 style={{ marginBottom: '12px', fontSize: '1.4rem' }}>Something went wrong</h2>
            <p className="text-muted" style={{ marginBottom: '24px', fontSize: '0.92rem' }}>
              An unexpected error occurred while rendering this view.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
              >
                <span className="material-icons icon-sm">refresh</span> Reload Page
              </button>
              <a href="/" className="btn btn-secondary">
                <span className="material-icons icon-sm">home</span> Back to Home
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
