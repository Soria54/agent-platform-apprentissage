import { COURS } from '../../lib/cours';

import Markdown from './Markdown';

/** Cours d'une étape, sans son titre (déjà porté par la page). */
export default function Cours({ dossier }) {
  const texte = COURS[dossier];
  if (!texte)
    return (
      <p className="text-muted">
        Pas encore de cours. Il s&apos;écrit dans <code>{dossier}/cours.md</code>, ou avec{' '}
        <code>/apprentissage:mettre-a-jour</code>.
      </p>
    );
  return <Markdown texte={texte} sansTitre />;
}
