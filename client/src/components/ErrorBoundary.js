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
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.removeItem('voya_session_id');
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'var(--ink, #0C0A08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
          <div style={{
            textAlign: 'center',
            maxWidth: 420,
            padding: '48px 32px',
            background: 'rgba(22, 19, 17, 0.9)',
            border: '1px solid rgba(201,165,90,0.15)',
            borderRadius: 20,
          }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 48,
              fontStyle: 'italic',
              color: '#C9A55A',
              marginBottom: 16,
            }}>✦</div>
            <h1 style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 28,
              fontWeight: 400,
              fontStyle: 'italic',
              color: '#F5F0E8',
              marginBottom: 12,
            }}>Something went wrong</h1>
            <p style={{
              fontSize: 14,
              color: '#8A8070',
              lineHeight: 1.6,
              marginBottom: 28,
            }}>
              Don't worry — your data is safe. Click below to start fresh.
            </p>
            <button
              onClick={this.handleReset}
              style={{
                padding: '12px 28px',
                background: 'linear-gradient(135deg, #C9A55A, #8B6E35)',
                border: 'none',
                borderRadius: 10,
                color: '#0C0A08',
                fontSize: 13,
                fontFamily: "'DM Sans', system-ui, sans-serif",
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >Start over</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
