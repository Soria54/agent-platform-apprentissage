import { useContext } from 'react';

import { DonneesContext } from '../lib/donneesContext';

/**
 * Données de la plateforme : `{ donnees, mode, etat, modifier, importer, reinitialiser }`.
 * `modifier(jeu, (copie) => { … })` modifie une copie du jeu, puis l'enregistre.
 */
export function useDonnees() {
  const contexte = useContext(DonneesContext);
  if (!contexte) throw new Error('useDonnees doit être utilisé dans DonneesProvider');
  return contexte;
}
