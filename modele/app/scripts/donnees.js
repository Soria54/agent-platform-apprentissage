// Fonctions Node partagées par le serveur Vite, le serveur de production et la ligne de
// commande : lecture, validation, normalisation et écriture des données de la plateforme,
// puis régénération des fichiers Markdown lisibles sur GitHub.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { appliquerTagAuto } from '../src/lib/importance.js';

import { fichiersMarkdown } from './markdown.js';

const ici = path.dirname(fileURLToPath(import.meta.url));
// Racine du dépôt : le dossier parent de app/, ou RACINE_DEPOT (conteneur Docker).
export const RACINE = process.env.RACINE_DEPOT
  ? path.resolve(process.env.RACINE_DEPOT)
  : path.resolve(ici, '../..');

// Un jeu de données = un fichier JSON dans donnees/.
export const JEUX = ['dictionnaire', 'pratiques', 'parcours', 'metier'];
const cheminJeu = (nom) => path.join(RACINE, 'donnees', `${nom}.json`);

export function lireJeu(nom) {
  return JSON.parse(fs.readFileSync(cheminJeu(nom), 'utf8'));
}

export function lireTout() {
  return Object.fromEntries(JEUX.map((nom) => [nom, lireJeu(nom)]));
}

const ensemble = (liste) => new Set((liste ?? []).map((x) => x.id));
const uniques = (liste, ref, erreurs) => {
  const vus = new Set();
  for (const x of liste ?? []) {
    if (!x.id || !/^[a-z0-9-]+$/.test(String(x.id)))
      erreurs.push(
        `${ref} ${x.id ?? JSON.stringify(x)} : id manquant ou invalide (minuscules, chiffres, tirets)`,
      );
    if (vus.has(x.id)) erreurs.push(`${ref} ${x.id} : id en double`);
    vus.add(x.id);
  }
};

function validerDictionnaire(d, idsEtapes) {
  const erreurs = [];
  const types = ensemble(d.types);
  const categories = ensemble(d.categories);
  const tags = ensemble(d.tags);
  const statuts = ensemble(d.statuts);
  const groupes = ensemble(d.groupes_tags);

  if (!Array.isArray(d.entrees)) return ['dictionnaire : « entrees » doit être un tableau'];
  for (const t of d.tags ?? [])
    if (!groupes.has(t.groupe)) erreurs.push(`tag ${t.id} : groupe inconnu « ${t.groupe} »`);

  const imp = d.importance;
  if (
    !imp ||
    !Array.isArray(imp.seuils) ||
    imp.seuils.some((s, i) => !Number.isInteger(s) || s <= (imp.seuils[i - 1] ?? 0))
  ) {
    erreurs.push("importance.seuils doit être une liste d'entiers strictement croissants");
  } else {
    if (imp.libelles?.length !== imp.seuils.length + 1)
      erreurs.push('importance.libelles doit contenir un libellé de plus que importance.seuils');
    if (!tags.has(imp.tag_auto))
      erreurs.push(`importance.tag_auto : tag inconnu « ${imp.tag_auto} »`);
  }

  uniques(d.entrees, 'entrée', erreurs);
  const ids = ensemble(d.entrees);
  for (const e of d.entrees) {
    const ref = e.id ?? JSON.stringify(e.terme);
    if (!e.terme?.trim()) erreurs.push(`${ref} : terme vide`);
    if (!types.has(e.type)) erreurs.push(`${ref} : type inconnu « ${e.type} »`);
    if (!categories.has(e.categorie))
      erreurs.push(`${ref} : catégorie inconnue « ${e.categorie} »`);
    if (!statuts.has(e.statut)) erreurs.push(`${ref} : statut inconnu « ${e.statut} »`);
    for (const t of e.tags ?? []) if (!tags.has(t)) erreurs.push(`${ref} : tag inconnu « ${t} »`);
    for (const n of e.etapes ?? [])
      if (!idsEtapes.has(n)) erreurs.push(`${ref} : étape inconnue « ${n} »`);
    for (const r of e.ressources ?? [])
      if (!r.url && !r.titre) erreurs.push(`${ref} : ressource vide`);
    for (const a of e.actualites ?? [])
      if (!a.date || !a.titre) erreurs.push(`${ref} : actualité sans date ou sans titre`);
    if (e.vus !== undefined && !(Number.isInteger(e.vus) && e.vus >= 0))
      erreurs.push(`${ref} : « vus » doit être un entier positif ou nul`);
    if (e.source && !['manuel', 'veille', 'professeur'].includes(e.source))
      erreurs.push(`${ref} : source inconnue « ${e.source} »`);
    for (const l of e.liens ?? []) {
      if (!ids.has(l)) erreurs.push(`${ref} : lien vers une entrée inexistante « ${l} »`);
      if (l === e.id) erreurs.push(`${ref} : lien vers lui-même`);
    }
  }
  return erreurs;
}

function validerPratiques(p, idsEntrees) {
  const erreurs = [];
  if (!Array.isArray(p.pratiques)) return ['pratiques : « pratiques » doit être un tableau'];
  const themes = ensemble(p.themes);
  const etats = ensemble(p.etats);
  uniques(p.pratiques, 'pratique', erreurs);
  for (const x of p.pratiques) {
    const ref = `pratique ${x.id}`;
    if (!x.titre?.trim()) erreurs.push(`${ref} : titre vide`);
    if (!themes.has(x.theme)) erreurs.push(`${ref} : thème inconnu « ${x.theme} »`);
    if (!etats.has(x.etat)) erreurs.push(`${ref} : état inconnu « ${x.etat} »`);
    if (x.comment !== undefined && !Array.isArray(x.comment))
      erreurs.push(`${ref} : « comment » doit être une liste`);
    for (const l of x.liens ?? [])
      if (!idsEntrees.has(l)) erreurs.push(`${ref} : lien vers une entrée inexistante « ${l} »`);
    for (const r of x.sources ?? []) if (!r.url) erreurs.push(`${ref} : source sans URL`);
    for (const h of x.historique ?? [])
      if (!h.date || !h.note) erreurs.push(`${ref} : historique sans date ou sans note`);
    if (x.source && !['manuel', 'veille', 'professeur'].includes(x.source))
      erreurs.push(`${ref} : source inconnue « ${x.source} »`);
  }
  return erreurs;
}

function validerParcours(p, idsEntrees) {
  const erreurs = [];
  if (!Array.isArray(p.etapes)) return ['parcours : « etapes » doit être un tableau'];
  const types = ensemble(p.types_ressources);
  const vus = new Set();
  for (const e of p.etapes) {
    const ref = `étape ${e.id}`;
    if (!Number.isInteger(e.id)) erreurs.push(`${ref} : id doit être un entier`);
    if (vus.has(e.id)) erreurs.push(`${ref} : id en double`);
    vus.add(e.id);
    if (!/^[0-9]{2}-[a-z0-9-]+$/.test(e.dossier ?? ''))
      erreurs.push(`${ref} : dossier invalide « ${e.dossier} » (forme 01-nom)`);
    if (!e.libelle?.trim()) erreurs.push(`${ref} : libellé vide`);
    uniques(e.notions, `${ref}, notion`, erreurs);
    for (const n of e.notions ?? [])
      for (const l of n.liens ?? [])
        if (!idsEntrees.has(l))
          erreurs.push(`${ref}, notion ${n.id} : lien vers une entrée inexistante « ${l} »`);
    uniques(e.ressources, `${ref}, ressource`, erreurs);
    for (const r of e.ressources ?? []) {
      if (!r.titre?.trim()) erreurs.push(`${ref}, ressource ${r.id} : titre vide`);
      if (r.type && !types.has(r.type))
        erreurs.push(`${ref}, ressource ${r.id} : type inconnu « ${r.type} »`);
    }
    uniques(e.exercices, `${ref}, exercice`, erreurs);
    for (const x of e.exercices ?? [])
      if (!x.titre?.trim()) erreurs.push(`${ref}, exercice ${x.id} : titre vide`);
  }
  return erreurs;
}

const TYPES_SECTION = ['texte', 'liste', 'numerotee', 'tableau', 'competences'];

function validerMetier(m, idsEtapes) {
  const erreurs = [];
  if (!m.intitule?.trim()) erreurs.push('métier : intitulé vide');
  if (!Array.isArray(m.sections)) return [...erreurs, 'métier : « sections » doit être un tableau'];
  uniques(m.sections, 'métier, section', erreurs);
  for (const s of m.sections) {
    const ref = `métier, section ${s.id}`;
    if (!TYPES_SECTION.includes(s.type)) erreurs.push(`${ref} : type inconnu « ${s.type} »`);
    if (s.type === 'tableau' && s.lignes?.some((l) => l.length !== s.colonnes?.length))
      erreurs.push(`${ref} : une ligne n'a pas autant de cellules que de colonnes`);
    if (s.type === 'competences')
      for (const c of s.lignes ?? [])
        for (const n of c.etapes ?? [])
          if (!idsEtapes.has(n)) erreurs.push(`${ref} : étape inconnue « ${n} »`);
  }
  return erreurs;
}

// Retourne la liste des erreurs (vide si tout est valide). Les jeux se référencent :
// les étapes viennent du parcours, les liens pointent vers le dictionnaire.
export function valider(tout) {
  const idsEtapes = new Set((tout.parcours?.etapes ?? []).map((e) => e.id));
  const idsEntrees = ensemble(tout.dictionnaire?.entrees);
  return [
    ...validerDictionnaire(tout.dictionnaire, idsEtapes),
    ...validerPratiques(tout.pratiques, idsEntrees),
    ...validerParcours(tout.parcours, idsEntrees),
    ...validerMetier(tout.metier, idsEtapes),
  ];
}

// Applique les règles calculées (tag automatique selon l'importance).
// Retourne le nombre d'entrées modifiées. L'ordre n'est jamais changé, pour garder des diffs courts.
// Points à compléter, qui ne bloquent pas l'enregistrement : cours ou énoncé manquant.
export function avertissements(tout) {
  const liste = [];
  for (const e of tout.parcours.etapes) {
    if (!fs.existsSync(path.join(RACINE, e.dossier, 'cours.md')))
      liste.push(`étape ${e.id} : ${e.dossier}/cours.md manquant`);
    for (const x of e.exercices ?? []) {
      if (
        x.dossier &&
        !fs.existsSync(path.join(RACINE, e.dossier, 'exercices', x.dossier, 'enonce.md'))
      )
        liste.push(
          `étape ${e.id}, exercice ${x.id} : ${e.dossier}/exercices/${x.dossier}/enonce.md manquant`,
        );
    }
  }
  return liste;
}

export function normaliser(tout) {
  let n = 0;
  for (const e of tout.dictionnaire.entrees)
    if (appliquerTagAuto(tout.dictionnaire.importance, e)) n++;
  return n;
}

const ecrireJson = (nom, donnees) =>
  fs.writeFileSync(cheminJeu(nom), JSON.stringify(donnees, null, 2) + '\n', 'utf8');

// Régénère tous les Markdown. Retourne les chemins écrits, relatifs à la racine du dépôt.
export function ecrireMarkdown(tout) {
  const ecrits = [];
  for (const [chemin, contenu] of fichiersMarkdown(tout)) {
    const absolu = path.join(RACINE, chemin);
    fs.mkdirSync(path.dirname(absolu), { recursive: true });
    fs.writeFileSync(absolu, contenu, 'utf8');
    ecrits.push(chemin);
  }
  return ecrits;
}

// Enregistre un jeu modifié depuis l'interface : validé avec les autres, puis écrit.
export function ecrireJeu(nom, donnees) {
  if (!JEUX.includes(nom)) return [`jeu de données inconnu « ${nom} »`];
  const tout = { ...lireTout(), [nom]: donnees };
  const erreurs = valider(tout);
  if (erreurs.length) return erreurs;
  if (nom === 'dictionnaire') normaliser(tout);
  ecrireJson(nom, tout[nom]);
  ecrireMarkdown(tout);
  return [];
}

export function ecrireTout(tout) {
  for (const nom of JEUX) ecrireJson(nom, tout[nom]);
  return ecrireMarkdown(tout);
}
