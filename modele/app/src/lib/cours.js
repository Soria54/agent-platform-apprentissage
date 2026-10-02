// Les cours sont écrits dans NN-etape/cours.md et les énoncés dans
// NN-etape/exercices/<dossier>/enonce.md. Ils sont intégrés au build : ils se lisent dans
// l'application et se modifient dans les fichiers (npm run dev les recharge).
export const COURS = Object.fromEntries(
  Object.entries(
    import.meta.glob('../../../*/cours.md', { query: '?raw', import: 'default', eager: true }),
  ).map(([chemin, texte]) => [chemin.split('/').at(-2), texte]),
);

const ENONCES = Object.fromEntries(
  Object.entries(
    import.meta.glob('../../../*/exercices/*/enonce.md', {
      query: '?raw',
      import: 'default',
      eager: true,
    }),
  ).map(([chemin, texte]) => [chemin.split('/').slice(-4, -1).join('/'), texte]),
);

export const enonce = (dossierEtape, dossierExercice) =>
  ENONCES[`${dossierEtape}/exercices/${dossierExercice}`];
