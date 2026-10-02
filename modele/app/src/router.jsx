import { createHashRouter } from 'react-router';

import AppLayout from './components/layout/AppLayout';
import AccueilPage from './pages/AccueilPage';
import ComponentsPage from './pages/ComponentsPage';
import ComposantsCoursPage from './pages/ComposantsCoursPage';
import DictionnairePage from './pages/DictionnairePage';
import EtapePage from './pages/EtapePage';
import MetierPage from './pages/MetierPage';
import NotFoundPage from './pages/NotFoundPage';
import PratiquesPage from './pages/PratiquesPage';

// Navigation par # : le build statique fonctionne sur n'importe quel hébergement.
export const router = createHashRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <AccueilPage /> },
      { path: 'parcours', element: <EtapePage /> },
      { path: 'parcours/:id', element: <EtapePage /> },
      { path: 'dictionnaire', element: <DictionnairePage /> },
      { path: 'pratiques', element: <PratiquesPage /> },
      { path: 'metier', element: <MetierPage /> },
      { path: 'composants', element: <ComponentsPage /> },
      { path: 'composants-cours', element: <ComposantsCoursPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
