import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#141414', color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <h2 style={{ marginBottom: '1rem' }}>Something went wrong.</h2>
          {this.state.error && (
            <pre style={{ margin: '1rem 0', padding: '1rem', backgroundColor: '#222', color: '#ff6b6b', borderRadius: '4px', textAlign: 'left', maxWidth: '80%', overflowX: 'auto', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
              {this.state.error.toString()}
              {"\n\n"}
              {this.state.error.stack}
            </pre>
          )}
          <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', backgroundColor: 'var(--primary, #e5b33e)', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
export default ErrorBoundary;
