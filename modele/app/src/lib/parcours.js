// Calculs partagés par les pages : avancement global, étape à reprendre, nouveautés.
import { avancementEtape, bilanEtape } from './progression.js';

export const deux = (n) => String(n).padStart(2, '0');

const RECENT = 30; // jours
export const JOURS_RECENTS = RECENT;
const ilYA = (jours) => new Date(Date.now() - jours * 86400000).toISOString().slice(0, 10);

/** Étapes comptées dans l'avancement global (les étapes optionnelles ne comptent pas). */
export const etapesCoeur = (parcours) => parcours.etapes.filter((e) => !e.optionnel);

export function avancementGlobal(parcours) {
  const coeur = etapesCoeur(parcours);
  return coeur.reduce((s, e) => s + avancementEtape(e), 0) / (coeur.length || 1);
}

/** Première étape non terminée, sinon la dernière. */
export function etapeCourante(parcours) {
  return (
    etapesCoeur(parcours).find((e) => avancementEtape(e) < 1) ?? parcours.etapes.at(-1) ?? null
  );
}

/** Totaux de tout le parcours pour notions, ressources ou exercices. */
export function total(parcours, champ) {
  return parcours.etapes.reduce(
    (acc, e) => {
      const b = bilanEtape(e)[champ];
      return { faits: acc.faits + b.faits, total: acc.total + b.total };
    },
    { faits: 0, total: 0 },
  );
}

/** Prochaines choses à faire dans une étape : une notion, un exercice, une ressource. */
export function prochainesActions(etape) {
  const actions = [];
  const notion = etape.notions.find((n) => !n.acquise);
  if (notion) actions.push({ quoi: 'Notion', texte: notion.libelle });
  const exercice = etape.exercices.find((x) => !x.fait);
  if (exercice) actions.push({ quoi: 'Exercice', texte: exercice.titre });
  const ressource = etape.ressources.find((r) => !r.lu);
  if (ressource) actions.push({ quoi: 'Lire', texte: ressource.titre });
  return actions;
}

/** Ce que la veille a apporté récemment, du plus récent au plus ancien. */
export function nouveautes(donnees) {
  const seuil = ilYA(RECENT);
  const liste = [];
  for (const e of donnees.dictionnaire.entrees) {
    if (e.source === 'veille' && e.ajoute_le >= seuil)
      liste.push({ date: e.ajoute_le, quoi: 'Nouveau mot', titre: e.terme, mot: e.id });
    for (const a of e.actualites ?? [])
      if (a.date >= seuil)
        liste.push({ date: a.date, quoi: e.terme, titre: a.titre, url: a.url, mot: e.id });
  }
  for (const p of donnees.pratiques.pratiques) {
    if (p.source === 'veille' && p.ajoute_le >= seuil)
      liste.push({ date: p.ajoute_le, quoi: 'Nouvelle pratique', titre: p.titre, pratique: true });
    for (const h of p.historique ?? [])
      if (h.date >= seuil)
        liste.push({
          date: h.date,
          quoi: 'Pratique révisée',
          titre: `${p.titre} : ${h.note}`,
          url: h.url,
          pratique: true,
        });
  }
  return liste.sort((a, b) => b.date.localeCompare(a.date));
}

/** Une révision de moins de 30 jours. */
export const revueRecemment = (pratique) =>
  (pratique.historique ?? []).some((h) => h.date >= ilYA(RECENT));
