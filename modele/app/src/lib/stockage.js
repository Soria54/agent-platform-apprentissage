// Deux modes de sauvegarde :
// - « fichier » : npm run dev ou serveur Node, chaque jeu modifié est écrit dans
//   donnees/<jeu>.json ;
// - « navigateur » : version statique (build), modifications gardées dans le
//   localStorage, à exporter en JSON pour les reporter dans le dépôt.
import dictionnaire from '../../../donnees/dictionnaire.json';
import metier from '../../../donnees/metier.json';
import parcours from '../../../donnees/parcours.json';
import pratiques from '../../../donnees/pratiques.json';

export const JEUX = ['dictionnaire', 'pratiques', 'parcours', 'metier'];
const DU_DEPOT = { dictionnaire, pratiques, parcours, metier };
const cle = (nom) => `{{name}}/${nom}`;

function lireLocal(nom) {
  try {
    return JSON.parse(localStorage.getItem(cle(nom)));
  } catch {
    return null; // stockage indisponible ou illisible
  }
}

export async function charger() {
  try {
    const rep = await fetch('./api/donnees');
    if (rep.ok && rep.headers.get('content-type')?.includes('json'))
      return { donnees: await rep.json(), mode: 'fichier' };
  } catch {
    // pas de serveur : mode navigateur
  }
  const donnees = {};
  for (const nom of JEUX) {
    const local = lireLocal(nom);
    donnees[nom] = local ? completer(nom, local) : structuredClone(DU_DEPOT[nom]);
  }
  return { donnees, mode: 'navigateur' };
}

// Des données gardées dans le navigateur peuvent dater d'une version antérieure :
// on leur ajoute ce qui est apparu depuis dans le dépôt.
function completer(nom, local) {
  const depot = DU_DEPOT[nom];
  if (nom === 'dictionnaire') {
    const d = { ...local, importance: local.importance ?? depot.importance };
    const connus = new Set(d.tags.map((t) => t.id));
    d.tags = [...d.tags, ...depot.tags.filter((t) => !connus.has(t.id))];
    return d;
  }
  if (nom === 'pratiques') {
    // La veille fait évoluer les pratiques : la version du dépôt l'emporte, sauf la case
    // « appliquée » cochée dans ce navigateur. Les pratiques ajoutées localement sont gardées.
    const parId = new Map((local.pratiques ?? []).map((p) => [p.id, p]));
    const ids = new Set(depot.pratiques.map((p) => p.id));
    return {
      ...depot,
      pratiques: [
        ...depot.pratiques.map((p) => ({
          ...p,
          appliquee: parId.get(p.id)?.appliquee ?? p.appliquee,
        })),
        ...(local.pratiques ?? []).filter((p) => !ids.has(p.id)),
      ],
    };
  }
  return local;
}

export async function enregistrer(nom, donnees, mode) {
  if (mode === 'fichier') {
    const rep = await fetch(`./api/donnees/${nom}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donnees),
    });
    if (!rep.ok) {
      const { erreurs } = await rep.json().catch(() => ({ erreurs: [rep.statusText] }));
      throw new Error(erreurs.join('\n'));
    }
    return;
  }
  localStorage.setItem(cle(nom), JSON.stringify(donnees));
}

export function oublierLocal() {
  try {
    for (const nom of JEUX) localStorage.removeItem(cle(nom));
  } catch {
    // rien à faire
  }
}

// Un seul fichier qui contient les quatre jeux, à redécouper dans donnees/.
export function exporter(donnees) {
  const blob = new Blob([JSON.stringify(donnees, null, 2) + '\n'], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '{{name}}.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

// Accepte l'export complet, ou un dictionnaire.json seul.
export function lireImport(brut) {
  if (Array.isArray(brut.entrees)) return { dictionnaire: brut };
  const trouves = JEUX.filter((nom) => brut[nom]);
  if (!trouves.length)
    throw new Error('le fichier ne contient ni « entrees » ni les jeux de la plateforme');
  return Object.fromEntries(trouves.map((nom) => [nom, brut[nom]]));
}
