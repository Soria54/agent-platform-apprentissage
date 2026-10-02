import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';

import { useDonnees } from '../../hooks/useDonnees';
import { useLectureConfortable } from '../../hooks/useLectureConfortable';
import plateforme from '../../lib/plateforme';
import { exporter } from '../../lib/stockage';
import { Button, NavBar, Toggle } from '../ui';

const links = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/parcours', label: 'Parcours' },
  { to: '/dictionnaire', label: 'Dictionnaire' },
  { to: '/pratiques', label: 'Pratiques' },
  { to: '/metier', label: 'Objectif' },
];

/** Gabarit commun : navigation, contenu de la page, puis barre des données. */
export default function AppLayout() {
  const { donnees, mode, etat, importer, reinitialiser } = useDonnees();
  const [confortable, setConfortable] = useLectureConfortable();
  const { pathname } = useLocation();

  useEffect(() => {
    scrollTo({ top: 0 });
  }, [pathname]);

  const versionDuDepot = () => {
    if (
      confirm('Revenir à la version du dépôt ? Les modifications de ce navigateur seront perdues.')
    )
      reinitialiser();
  };

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <NavBar brand={plateforme.titre} links={links} />
      {mode === 'navigateur' && (
        <p className="border-b border-line px-4 py-2 text-center text-[13px] text-muted">
          Mode navigateur : les modifications restent dans ce navigateur. Exporte-les pour les
          reporter dans <code>donnees/</code>.
        </p>
      )}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-8 sm:py-16">
        <Outlet />
      </main>
      <footer className="border-t border-black">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4 sm:px-8">
          <p
            role="status"
            className={etat.type === 'erreur' ? 'text-sm text-danger' : 'text-sm text-muted'}
          >
            {etat.message || (mode === 'fichier' ? 'Mode fichier' : 'Mode navigateur')}
          </p>
          <Toggle label="Lecture confortable" checked={confortable} onChange={setConfortable} />
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <Button size="sm" variant="secondary" onClick={() => exporter(donnees)}>
              Exporter
            </Button>
            <label className="inline-flex cursor-pointer items-center border border-black px-3 py-1.5 text-[13px] font-medium hover:bg-black hover:text-white">
              Importer
              <input
                type="file"
                accept="application/json"
                className="sr-only"
                onChange={(e) => e.target.files[0] && importer(e.target.files[0])}
              />
            </label>
            {mode === 'navigateur' && (
              <Button size="sm" variant="ghost" onClick={versionDuDepot}>
                Version du dépôt
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
