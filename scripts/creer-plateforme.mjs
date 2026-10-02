#!/usr/bin/env node
/**
 * Crée une plateforme d'apprentissage vide (sans étapes) à partir du modèle.
 * Usage :
 *   node creer-plateforme.mjs <dossier> --titre "Apprendre SQL" --sujet "Écrire des requêtes…"
 *     --couleur mizu [--objectif "Développeur SQL"] [--design <dossier du plugin design>]
 * Le dossier ne doit pas exister ou doit être vide. N'installe pas les dépendances.
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
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
const [dossier] = positional;
if (!dossier || typeof options.titre !== 'string' || typeof options.sujet !== 'string')
  fail('usage : creer-plateforme.mjs <dossier> --titre "…" --sujet "…" --couleur <couleur>');

const cible = resolve(dossier);
if (existsSync(cible) && readdirSync(cible).length > 0) fail(`le dossier ${cible} n'est pas vide`);

const design = trouverDesign(options.design);
const couleur = typeof options.couleur === 'string' ? options.couleur : 'mizu';
const titre = options.titre.trim();
const sujet = options.sujet.trim();
const objectif = typeof options.objectif === 'string' ? options.objectif.trim() : titre;
const name = slug(basename(cible)) || 'plateforme';
console.log(`Plugin design : ${design}`);

mkdirSync(cible, { recursive: true });
construireApp(join(cible, 'app'), { titre, couleur, design, name });
for (const chemin of readdirSync(join(pluginRoot, 'modele', 'racine'))) copierRacine(cible, chemin);
copyFileSync(join(pluginRoot, 'pedagogie', 'STYLE.md'), join(cible, '_modeles', 'style.md'));

const plateforme = {
  titre,
  sujet,
  couleur,
  modele: versionPlugin(),
  design: versionDesign(design),
  cree_le: new Date().toISOString().slice(0, 10),
};
writeFileSync(join(cible, 'plateforme.json'), `${JSON.stringify(plateforme, null, 2)}\n`);
remplacer(cible, { titre, sujet, objectif, couleur, name });

// Premiers Markdown générés (metier/README.md, donnees/*.md).
execFileSync(process.execPath, [join(cible, 'app', 'scripts', 'cli.js'), 'normaliser'], {
  stdio: 'inherit',
});

console.log(`Plateforme « ${titre} » créée dans ${cible}`);
console.log('Étapes suivantes : git init -b main, cd app, npm install, écrire les étapes.');
