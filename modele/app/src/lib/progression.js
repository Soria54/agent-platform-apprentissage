// Avancement calculé du parcours : il n'est jamais saisi.
// Module sans dépendance : utilisé par l'interface et par les scripts Node.

const compte = (liste, champ) => ({
  faits: (liste ?? []).filter((x) => x[champ]).length,
  total: (liste ?? []).length,
});

export function bilanEtape(e) {
  return {
    notions: compte(e.notions, 'acquise'),
    ressources: compte(e.ressources, 'lu'),
    exercices: compte(e.exercices, 'fait'),
  };
}

// Part réalisée d'une étape, de 0 à 1 : notions, ressources et exercices comptent à parts égales.
export function avancementEtape(e) {
  const b = bilanEtape(e);
  const parts = [b.notions, b.ressources, b.exercices]
    .filter((p) => p.total)
    .map((p) => p.faits / p.total);
  return parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length : 0;
}

export const pourcent = (x) => `${Math.round(x * 100)} %`;
