/* eslint-disable no-console -- outil en ligne de commande */
// Usage : node scripts/cli.js valider | normaliser
//   valider    : contrôle les fichiers de donnees/ sans rien modifier
//   normaliser : applique les règles calculées (tag automatique) puis régénère tous les Markdown
import { JEUX, avertissements, ecrireTout, lireTout, normaliser, valider } from './donnees.js';

const commande = process.argv[2];
const tout = lireTout();
const erreurs = valider(tout);

if (erreurs.length) {
  console.error(`❌ ${erreurs.length} erreur(s) dans donnees/ :`);
  for (const e of erreurs) console.error(`  - ${e}`);
  process.exit(1);
}

if (commande === 'normaliser') {
  const modifiees = normaliser(tout);
  const ecrits = ecrireTout(tout);
  console.log(
    `✅ ${modifiees} entrée(s) mises à jour, ${ecrits.length} fichiers Markdown régénérés`,
  );
} else {
  const p = tout.parcours.etapes;
  console.log(
    `✅ données valides : ${tout.dictionnaire.entrees.length} entrées, ${tout.pratiques.pratiques.length} pratiques, ${p.length} étapes (${JEUX.length} fichiers)`,
  );
}

const aCompleter = avertissements(tout);
if (aCompleter.length) {
  console.warn(`⚠️ ${aCompleter.length} point(s) à compléter :`);
  for (const a of aCompleter) console.warn(`  - ${a}`);
}
