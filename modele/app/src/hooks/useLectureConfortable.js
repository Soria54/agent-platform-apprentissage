import { useEffect, useState } from 'react';

const CLE = '{{name}}/lecture-confortable';

function lire() {
  try {
    return localStorage.getItem(CLE) === 'oui';
  } catch {
    return false;
  }
}

/**
 * Mode « lecture confortable » : texte plus grand, plus espacé, lignes plus courtes.
 * Le choix est gardé dans le navigateur.
 */
export function useLectureConfortable() {
  const [actif, setActif] = useState(lire);

  useEffect(() => {
    document.documentElement.classList.toggle('lecture-confortable', actif);
    try {
      localStorage.setItem(CLE, actif ? 'oui' : 'non');
    } catch {
      // stockage indisponible : le choix vaut pour cette visite
    }
  }, [actif]);

  return [actif, setActif];
}
