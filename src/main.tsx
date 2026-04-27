import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

// Global error shielding
window.addEventListener('error', (event) => {
  if (event.target && (event.target instanceof HTMLImageElement || event.target instanceof HTMLScriptElement)) {
    console.warn('Resource failed to load:', event.target.src);
    // You could potentially implement fallback logic here if needed
  }
}, true);

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
