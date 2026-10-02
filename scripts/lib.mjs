// Fonctions partagées par les scripts du plugin apprentissage.
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const pluginRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
export const modele = join(pluginRoot, 'modele');

export const versionPlugin = () =>
  JSON.parse(readFileSync(join(pluginRoot, '.claude-plugin', 'plugin.json'), 'utf8')).version;

export function fail(message) {
  console.error(`Erreur : ${message}`);
  process.exit(1);
}

/** Lit `--cle valeur` et les arguments positionnels. */
export function parseArgs(argv) {
  const options = {};
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) options[key] = true;
      else {
        options[key] = next;
        i += 1;
      }
    } else positional.push(arg);
  }
  return { options, positional };
}

export const slug = (texte) =>
  texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const estDesign = (dossier) =>
  dossier &&
  existsSync(join(dossier, 'scripts', 'create-project.mjs')) &&
  existsSync(join(dossier, 'design', 'GUIDE.md'));

/**
 * Trouve le dossier du plugin design, dans cet ordre :
 * 1. l'option --design ou la variable DESIGN_PLUGIN_ROOT ;
 * 2. `claude plugin list --json` (plugin design installé, dépendance de ce plugin) ;
 * 3. le cache des plugins (~/.claude/plugins/cache/<marketplace>/design/<version>) ;
 * 4. un clone voisin du dépôt agent-design.
 */
export function trouverDesign(option) {
  const candidats = [];
  if (typeof option === 'string') candidats.push(resolve(option));
  if (process.env.DESIGN_PLUGIN_ROOT) candidats.push(resolve(process.env.DESIGN_PLUGIN_ROOT));
  try {
    const sortie = execFileSync('claude', ['plugin', 'list', '--json'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      shell: process.platform === 'win32',
      timeout: 30000,
    });
    const liste = JSON.parse(sortie);
    for (const p of Array.isArray(liste) ? liste : (liste.installed ?? []))
      if (/^design@/.test(p.id ?? '') && p.installPath) candidats.push(p.installPath);
  } catch {
    // CLI absente ou format inattendu : on cherche ailleurs
  }
  const cache = join(homedir(), '.claude', 'plugins', 'cache');
  if (existsSync(cache))
    for (const marketplace of readdirSync(cache)) {
      const dossier = join(cache, marketplace, 'design');
      if (!existsSync(dossier)) continue;
      const versions = readdirSync(dossier)
        .map((v) => join(dossier, v))
        .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
      candidats.push(...versions);
    }
  candidats.push(resolve(pluginRoot, '..', 'agent-design'));
  const trouve = candidats.find(estDesign);
  if (!trouve)
    fail(
      'plugin design introuvable. Installe-le (/plugin install design@atelier), ou passe ' +
        '--design <dossier>, par exemple un clone de https://github.com/Soria54/agent-design.git',
    );
  return trouve;
}

export const versionDesign = (design) => {
  try {
    return JSON.parse(readFileSync(join(design, '.claude-plugin', 'plugin.json'), 'utf8')).version;
  } catch {
    return null;
  }
};

// Échappement selon le type de fichier, pour qu'un titre avec « " » ou « ' » ne casse rien.
const echapper = {
  // Les guillemets droits deviennent « … » : Prettier réécrirait les &quot;.
  '.html': (v) =>
    v
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"([^"]*)"/g, '« $1 »')
      .replace(/"/g, ''),
  '.json': (v) => JSON.stringify(v).slice(1, -1),
  '.webmanifest': (v) => JSON.stringify(v).slice(1, -1),
  '.sh': (v) => v.replace(/["$`\\]/g, ''),
  '.yml': (v) => v.replace(/["\n]/g, ''),
};
const texte = /\.(jsx?|mjs|json|webmanifest|html|css|md|yml|sh|example)$|^Dockerfile$/;

/** Remplace les `{{cle}}` dans un fichier, ou dans les fichiers texte d'un dossier. */
export function remplacer(chemin, valeurs) {
  const entree = basename(chemin);
  if (entree === 'node_modules' || entree === '.git') return;
  if (statSync(chemin).isDirectory()) {
    for (const enfant of readdirSync(chemin)) remplacer(join(chemin, enfant), valeurs);
    return;
  }
  if (!texte.test(entree)) return;
  const extension = entree.match(/\.[a-z]+$/)?.[0];
  const esc = echapper[extension] ?? ((v) => v);
  const contenu = readFileSync(chemin, 'utf8');
  const suivant = contenu.replace(/\{\{([a-z_]+)\}\}/g, (tout, cle) =>
    cle in valeurs ? esc(String(valeurs[cle])) : tout,
  );
  if (suivant !== contenu) writeFileSync(chemin, suivant);
}

const exportsUi = ['Callout', 'Progress', 'Select', 'Stat', 'Textarea'];

/**
 * Construit app/ : modèle du plugin design (create-project.mjs), puis les fichiers de la
 * plateforme par-dessus, puis le package.json fusionné.
 */
export function construireApp(cible, { titre, couleur, design, name }) {
  execFileSync(
    process.execPath,
    [
      join(design, 'scripts', 'create-project.mjs'),
      cible,
      '--title',
      titre,
      '--highlight',
      couleur,
    ],
    { stdio: 'inherit' },
  );
  for (const inutile of ['src/pages/HomePage.jsx', 'src/services'])
    rmSync(join(cible, inutile), { recursive: true, force: true });
  cpSync(join(modele, 'app'), cible, { recursive: true });

  const index = join(cible, 'src', 'components', 'ui', 'index.js');
  let exportsTexte = readFileSync(index, 'utf8');
  for (const nom of exportsUi)
    if (!exportsTexte.includes(`as ${nom} }`))
      exportsTexte += `export { default as ${nom} } from './${nom}';\n`;
  const lignes = exportsTexte.trim().split('\n').sort();
  writeFileSync(index, `${lignes.join('\n')}\n`);

  const pkgChemin = join(cible, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgChemin, 'utf8'));
  pkg.name = name;
  pkg.description = `Application de la plateforme d'apprentissage « ${titre} »`;
  pkg.scripts = {
    ...pkg.scripts,
    start: 'node server.js',
    valider: 'node scripts/cli.js valider',
    normaliser: 'node scripts/cli.js normaliser',
    // Le dépôt git est le dossier parent : les hooks Husky sont dans app/.husky.
    prepare: 'cd .. && husky app/.husky',
  };
  pkg.dependencies = { ...pkg.dependencies, mermaid: '^11.17.2' };
  pkg.dependencies = Object.fromEntries(Object.entries(pkg.dependencies).sort());
  writeFileSync(pkgChemin, `${JSON.stringify(pkg, null, 2)}\n`);
}

/** Copie un fichier ou un dossier du modèle de racine, sans écraser si `garder`. */
export function copierRacine(cible, chemin, { garder = false } = {}) {
  const destination = join(cible, chemin);
  if (garder && existsSync(destination)) return false;
  cpSync(join(modele, 'racine', chemin), destination, { recursive: true });
  return true;
}

export { basename };
