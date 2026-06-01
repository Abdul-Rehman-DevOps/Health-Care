import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { HospitalBrandingProvider } from './context/HospitalBrandingContext';
import { ToastProvider } from './context/ToastContext';
import App from './App';
import './index.css';
import './styles/lc-prescription-pad.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 15_000,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HospitalBrandingProvider>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </HospitalBrandingProvider>
    </QueryClientProvider>
  </StrictMode>
);
