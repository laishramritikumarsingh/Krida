import React, { StrictMode, Component, ReactNode, ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('KRIDA Root Error Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#080909',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            backgroundColor: '#121618',
            border: '1px solid #3d471d',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center',
            boxShadow: '0 0 25px rgba(215,255,67,0.1)'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#ffffff' }}>
              KRIDA <span style={{ color: '#D7FF43' }}>AI</span>
            </div>
            <div style={{ fontSize: '11px', color: '#88A8C8', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '4px', fontFamily: 'monospace' }}>
              INTELLIGENT FITNESS PLATFORM
            </div>
            <div style={{ marginTop: '20px', fontSize: '15px', fontWeight: '700', color: '#ffffff' }}>
              System Reload Required
            </div>
            <p style={{ fontSize: '12px', color: '#88A8C8', lineHeight: '1.6', marginTop: '8px' }}>
              KRIDA experienced a state synchronization notice. Click below to reset state and refresh your dashboard.
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('krida_token');
                window.location.reload();
              }}
              style={{
                marginTop: '20px',
                padding: '10px 24px',
                borderRadius: '10px',
                backgroundColor: '#D7FF43',
                color: '#080909',
                fontWeight: '800',
                fontSize: '12px',
                letterSpacing: '0.05em',
                border: 'none',
                cursor: 'pointer',
                textTransform: 'uppercase'
              }}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
);

if (typeof window !== 'undefined') {
  (window as any).__KRIDA_MOUNTED__ = true;
}
