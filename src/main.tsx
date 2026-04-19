import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { CurrencyProvider } from './contexts/CurrencyContext.tsx';
import { BusinessProvider } from './contexts/BusinessContext.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { ReceiptsProvider } from './contexts/ReceiptsContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BusinessProvider>
      <ReceiptsProvider>
        <ThemeProvider>
          <CurrencyProvider>
            <App />
          </CurrencyProvider>
        </ThemeProvider>
      </ReceiptsProvider>
    </BusinessProvider>
  </StrictMode>,
);
