// Importance d'une entrée, calculée à partir du nombre de fois où la notion a été vue.
// Module sans dépendance : utilisé par l'interface et par les scripts Node.

// Semaine ISO d'une date AAAA-MM-JJ, sous la forme « 2026-S40 ».
export function semaineIso(date) {
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  const jour = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - jour); // jeudi de la même semaine
  const debutAnnee = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const semaine = Math.ceil(((d - debutAnnee) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-S${String(semaine).padStart(2, '0')}`;
}

// Une occurrence = un « vu » personnel, ou une semaine distincte où la veille a cité la notion.
export function occurrences(entree) {
  const semaines = new Set(
    (entree.actualites ?? []).map((a) => semaineIso(a.date)).filter(Boolean),
  );
  return { vus: entree.vus ?? 0, veille: semaines.size, total: (entree.vus ?? 0) + semaines.size };
}

// Niveau d'importance (1 à N) selon les seuils configurés dans le dictionnaire.
export function niveauImportance(config, entree) {
  const total = occurrences(entree).total;
  return 1 + config.seuils.filter((s) => total >= s).length;
}

// Ajoute le tag automatique au niveau maximal. Ne le retire jamais : un tag posé
// à la main, ou atteint une fois, reste. Retourne true si l'entrée a changé.
export function appliquerTagAuto(config, entree) {
  const max = config.seuils.length + 1;
  if (niveauImportance(config, entree) < max || entree.tags.includes(config.tag_auto)) return false;
  entree.tags.push(config.tag_auto);
  return true;
}
