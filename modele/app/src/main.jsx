import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';

import DonneesProvider from './components/plateforme/DonneesProvider';
import { queryClient } from './lib/queryClient';
import { router } from './router';
import './styles/index.css';
import './styles/plateforme.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <DonneesProvider>
        <RouterProvider router={router} />
      </DonneesProvider>
    </QueryClientProvider>
  </StrictMode>,
);
