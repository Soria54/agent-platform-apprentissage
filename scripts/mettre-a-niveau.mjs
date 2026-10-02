#!/usr/bin/env node
/**
 * Met l'application d'une plateforme existante à la dernière version du modèle.
 * Les données (donnees/), les cours, les exercices, README.md et CLAUDE.md ne sont pas touchés.
 * Usage :
 *   node mettre-a-niveau.mjs <dossier> [--couleur mizu] [--titre "…"] [--sujet "…"]
 *     [--infra] [--design <dossier>] [--force]
 *   --infra : remplace aussi Dockerfile, docker-compose.yml, workflow GitHub et deploiement/.
 *   --force : accepte un dépôt git avec des modifications non commitées.
 * Sert aussi à migrer un ancien parcours (parcours-ia, parcours-big-data) vers le modèle.
 */
import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  cpSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';

import {
  construireApp,
  copierRacine,
  fail,
  parseArgs,
  pluginRoot,
  remplacer,
  slug,
  trouverDesign,
  versionDesign,
  versionPlugin,
} from './lib.mjs';

const { options, positional } = parseArgs(process.argv.slice(2));
const cible = resolve(positional[0] ?? '.');
if (!existsSync(join(cible, 'donnees', 'parcours.json')))
  fail(`${cible} n'est pas une plateforme : donnees/parcours.json introuvable`);

if (!options.force && existsSync(join(cible, '.git'))) {
  const etat = execFileSync('git', ['status', '--porcelain'], { cwd: cible, encoding: 'utf8' });
  if (etat.trim()) fail('le dépôt a des modifications non commitées (ou relancer avec --force)');
}

const cheminPlateforme = join(cible, 'plateforme.json');
const ancien = existsSync(cheminPlateforme)
  ? JSON.parse(readFileSync(cheminPlateforme, 'utf8'))
  : {};
const titre = String(options.titre ?? ancien.titre ?? basename(cible));
const sujet = String(options.sujet ?? ancien.sujet ?? '');
const couleur = String(options.couleur ?? ancien.couleur ?? 'mizu');
if (!sujet) fail('sujet inconnu : passer --sujet "…" (il sera gardé dans plateforme.json)');
const name = slug(basename(cible)) || 'plateforme';
const design = trouverDesign(options.design);
console.log(`Plugin design : ${design}`);

// 1. Nouvelle application construite à part, puis mise à la place de l'ancienne
//    (node_modules est gardé pour aller plus vite ; npm install le mettra à jour).
const temporaire = mkdtempSync(join(tmpdir(), 'plateforme-'));
const neuve = join(temporaire, 'app');
construireApp(neuve, { titre, couleur, design, name });
remplacer(neuve, { titre, sujet, couleur, name, objectif: titre });
const app = join(cible, 'app');
if (existsSync(app))
  for (const entree of readdirSync(app))
    if (entree !== 'node_modules') rmSync(join(app, entree), { recursive: true, force: true });
cpSync(neuve, app, { recursive: true });
rmSync(temporaire, { recursive: true, force: true });
console.log('app/ remplacé par la dernière version du modèle');

// 2. Fichiers de racine : ajoutés s'ils manquent ; remplacés avec --infra.
const ajoutes = [];
const infra = [
  'Dockerfile',
  '.dockerignore',
  'docker-compose.yml',
  '.github/workflows/plateforme.yml',
  'deploiement',
];
for (const chemin of infra)
  if (copierRacine(cible, chemin, { garder: !options.infra })) ajoutes.push(chemin);
for (const chemin of ['CLAUDE.md', '.env.example', '.gitignore', 'veille', '_modeles', 'memoire'])
  if (copierRacine(cible, chemin, { garder: true })) ajoutes.push(chemin);
// Mémoire : un CLAUDE.md d'avant la version 0.2.0 n'importe pas encore memoire/.
const claudeMd = join(cible, 'CLAUDE.md');
const contenuClaude = readFileSync(claudeMd, 'utf8');
if (!contenuClaude.includes('@memoire/')) {
  writeFileSync(
    claudeMd,
    `${contenuClaude.trimEnd()}\n\n## Qui j'apprends avec toi\n\n@memoire/apprenant.md\n\n` +
      `## Où j'en suis\n\n@memoire/etat.md\n\n` +
      '`memoire/apprenant.md` et `memoire/journal.md` sont tenus à jour par ' +
      '`/apprentissage:professeur` ; `memoire/etat.md` est généré par `npm run normaliser`.\n',
  );
  console.log('CLAUDE.md : imports de memoire/ ajoutés');
}
const style = join(cible, '_modeles', 'style.md');
copyFileSync(join(pluginRoot, 'pedagogie', 'STYLE.md'), style);
ajoutes.push('_modeles/style.md');

const plateforme = {
  ...ancien,
  titre,
  sujet,
  couleur,
  modele: versionPlugin(),
  design: versionDesign(design),
  cree_le: ancien.cree_le ?? new Date().toISOString().slice(0, 10),
  mis_a_niveau_le: new Date().toISOString().slice(0, 10),
};
writeFileSync(cheminPlateforme, `${JSON.stringify(plateforme, null, 2)}\n`);
// Seulement dans les fichiers copiés : un cours peut contenir « {{…} } » volontairement.
for (const chemin of ajoutes)
  remplacer(join(cible, chemin), { titre, sujet, couleur, name, objectif: titre });
console.log(`Fichiers ajoutés ou remplacés : ${ajoutes.join(', ')}`);

// Fichiers d'un ancien parcours devenus inutiles : signalés, jamais supprimés par le script.
const anciens = [
  '.github/workflows/parcours.yml',
  ...(existsSync(join(cible, 'metier'))
    ? readdirSync(join(cible, 'metier'))
        .filter((f) => f.endsWith('.md') && f !== 'README.md')
        .map((f) => `metier/${f}`)
    : []),
].filter((f) => existsSync(join(cible, f)));
if (anciens.length)
  console.warn(`⚠️ Anciens fichiers à vérifier puis supprimer : ${anciens.join(', ')}`);

// 3. Vérification des données et Markdown régénérés.
execFileSync(process.execPath, [join(app, 'scripts', 'cli.js'), 'normaliser'], {
  stdio: 'inherit',
});
console.log('Étapes suivantes : cd app && npm install && npm run lint && npm run build.');
