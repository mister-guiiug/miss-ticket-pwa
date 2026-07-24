import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from '@mister-guiiug/dev-wpa-config/react';
import {
  installErrorReporter,
  recordError,
} from '@mister-guiiug/dev-wpa-config/react/observability';
import './index.css';
import App from './App';

installErrorReporter();

const rootElement = document.getElementById('app');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary
        onError={error => {
          recordError(error, { source: 'error-boundary' });
        }}
      >
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
}
