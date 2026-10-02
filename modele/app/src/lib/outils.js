export const aujourdhui = () => new Date().toISOString().slice(0, 10);

export function slug(texte) {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function idUnique(base, idsExistants) {
  const racine = slug(base) || 'entree';
  let id = racine;
  for (let i = 2; idsExistants.has(id); i++) id = `${racine}-${i}`;
  return id;
}

import { niveauImportance } from './importance.js';

export const libelle = (liste, id) => liste.find((x) => x.id === id)?.libelle ?? id;

export const FILTRES_VIDES = {
  texte: '',
  types: [],
  categories: [],
  etapes: [],
  tags: [],
  statuts: [],
  importances: [],
  veilleSeulement: false,
};

export function filtrer(dictionnaire, f) {
  const q = slug(f.texte);
  return dictionnaire.entrees.filter(
    (e) =>
      (!q || slug(`${e.terme} ${e.definition} ${e.commentaire}`).includes(q)) &&
      (!f.types.length || f.types.includes(e.type)) &&
      (!f.categories.length || f.categories.includes(e.categorie)) &&
      (!f.etapes.length || e.etapes.some((n) => f.etapes.includes(n))) &&
      // une entrée doit porter tous les tags sélectionnés
      f.tags.every((t) => e.tags.includes(t)) &&
      (!f.statuts.length || f.statuts.includes(e.statut)) &&
      (!f.importances.length ||
        f.importances.includes(niveauImportance(dictionnaire.importance, e))) &&
      (!f.veilleSeulement || e.source === 'veille'),
  );
}

// Niveaux d'importance sous forme de liste d'options { id, libelle }.
export const niveaux = (dictionnaire) =>
  dictionnaire.importance.libelles.map((libelle, i) => ({ id: i + 1, libelle }));

export const nouvelleEntree = (dictionnaire) => ({
  id: '',
  terme: '',
  type: 'terme',
  categorie: dictionnaire.categories[0]?.id ?? '',
  definition: '',
  etapes: [],
  tags: [],
  liens: [],
  statut: 'a-decouvrir',
  commentaire: '',
  ressources: [],
  actualites: [],
  vus: 0,
  source: 'manuel',
  ajoute_le: aujourdhui(),
  modifie_le: aujourdhui(),
});
