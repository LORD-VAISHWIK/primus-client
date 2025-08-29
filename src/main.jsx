import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

async function bootstrap() {
  // Lightweight callback route: if we're on /social-callback and have ?token=, persist and notify opener
  if (typeof window !== 'undefined' && window.location.pathname === '/social-callback') {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      try { localStorage.setItem('primus_jwt', token); } catch {}
      try { if (window.opener) window.opener.postMessage({ type: 'primus_auth', token }, '*'); } catch {}
    }
    // Close if popup, otherwise redirect to root
    try { window.close(); } catch {}
    if (!window.opener) {
      window.location.replace('/');
    }
    return;
  }

  // Simple route split: /admin loads Admin portal, others load user app
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  let RootComponent;
  if (path.startsWith('/admin')) {
    const { default: AdminEntry } = await import('./AdminEntry.jsx');
    RootComponent = AdminEntry;
  } else {
    const Module = await import('./App.jsx');
    RootComponent = Module.default;
  }
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <RootComponent />
    </React.StrictMode>
  );
}

bootstrap();
