import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// Performance monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

// Service Worker temporär deaktiviert
// PWA features können später reaktiviert werden

// Web Vitals reporting
function sendToAnalytics(metric) {
  // In production, you would send this to your analytics service
  console.log('Web Vital:', metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);

// Global error handling
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Feature detection warnings
const checkRequiredFeatures = () => {
  const warnings = [];
  
  if (!('WebAssembly' in window)) {
    warnings.push('WebAssembly wird nicht unterstützt');
  }
  
  if (!('Worker' in window)) {
    warnings.push('Web Workers werden nicht unterstützt');
  }
  
  if (!('SharedArrayBuffer' in window)) {
    console.warn('SharedArrayBuffer nicht verfügbar - Performance könnte beeinträchtigt sein');
  }
  
  if (!('OffscreenCanvas' in window)) {
    console.warn('OffscreenCanvas nicht verfügbar');
  }
  
  if (warnings.length > 0) {
    alert(`Ihr Browser unterstützt nicht alle erforderlichen Features:\n${warnings.join('\n')}\n\nBitte verwenden Sie einen aktuellen Browser.`);
  }
};

// Check features after DOM is ready
document.addEventListener('DOMContentLoaded', checkRequiredFeatures);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
); 