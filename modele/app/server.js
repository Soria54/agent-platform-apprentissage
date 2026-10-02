/* eslint-disable no-console -- outil en ligne de commande */
// Serveur de production : sert l'application construite (dist/) et la même API
// que le serveur de développement, pour lire et enregistrer les fichiers de donnees/.
// Aucune dépendance : Node 20 ou plus suffit.
//
// Variables d'environnement :
//   PORT          port d'écoute (8080 par défaut)
//   RACINE_DEPOT  dossier du dépôt qui contient donnees/ (par défaut : le parent de app/)
//   MOT_DE_PASSE  si défini, protège tout le site par une authentification HTTP Basic
//   IDENTIFIANT   identifiant attendu avec MOT_DE_PASSE (« moi » par défaut)
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { JEUX, RACINE, ecrireJeu, lireTout } from './scripts/donnees.js';

const ici = path.dirname(fileURLToPath(import.meta.url));
const TITRE = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(RACINE, 'plateforme.json'), 'utf8')).titre;
  } catch {
    return 'Plateforme';
  }
})();
const DIST = path.join(ici, 'dist');
const PORT = Number(process.env.PORT) || 8080;
const MOT_DE_PASSE = process.env.MOT_DE_PASSE || '';
const IDENTIFIANT = process.env.IDENTIFIANT || 'moi';
const TAILLE_MAX = 5 * 1024 * 1024;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const egal = (a, b) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

function autorise(req) {
  if (!MOT_DE_PASSE) return true;
  const [schema, valeur] = (req.headers.authorization || '').split(' ');
  if (schema !== 'Basic' || !valeur) return false;
  const texte = Buffer.from(valeur, 'base64').toString();
  const i = texte.indexOf(':');
  return i > 0 && egal(texte.slice(0, i), IDENTIFIANT) && egal(texte.slice(i + 1), MOT_DE_PASSE);
}

function json(res, code, corps) {
  res.writeHead(code, { 'Content-Type': TYPES['.json'], 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(corps));
}

function api(req, res, nom) {
  if (req.method === 'GET' && !nom) return json(res, 200, lireTout());
  if (req.method !== 'PUT' || !JEUX.includes(nom))
    return json(res, 404, { erreurs: ['Route inconnue'] });

  let brut = '';
  let trop = false;
  req.setEncoding('utf8');
  req.on('data', (morceau) => {
    brut += morceau;
    if (brut.length > TAILLE_MAX && !trop) {
      trop = true;
      json(res, 413, { erreurs: ['Données trop volumineuses'] });
      req.destroy();
    }
  });
  req.on('end', () => {
    if (trop) return;
    try {
      const erreurs = ecrireJeu(nom, JSON.parse(brut));
      if (erreurs.length) return json(res, 400, { erreurs });
      json(res, 200, { ok: true });
    } catch (e) {
      json(res, 400, { erreurs: [e.message] });
    }
  });
}

function fichier(res, chemin) {
  const ext = path.extname(chemin);
  // Les fichiers de assets/ portent une empreinte dans leur nom : cache long.
  const cache = chemin.includes(`${path.sep}assets${path.sep}`)
    ? 'public, max-age=31536000, immutable'
    : 'no-cache';
  res.writeHead(200, {
    'Content-Type': TYPES[ext] || 'application/octet-stream',
    'Cache-Control': cache,
  });
  fs.createReadStream(chemin).pipe(res);
}

const serveur = http.createServer((req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');

  const url = new URL(req.url, 'http://localhost');
  // Vérification de santé, sans authentification (pour Docker et les hébergeurs).
  if (url.pathname === '/sante') return json(res, 200, { ok: true });

  if (!autorise(req)) {
    res.writeHead(401, {
      'WWW-Authenticate': `Basic realm="${TITRE.replace(/"/g, '')}", charset="UTF-8"`,
    });
    return res.end('Authentification requise');
  }

  if (url.pathname === '/api/donnees' || url.pathname.startsWith('/api/donnees/')) {
    return api(req, res, url.pathname.slice('/api/donnees'.length).replace(/^\/+|\/+$/g, ''));
  }
  if (req.method !== 'GET' && req.method !== 'HEAD')
    return json(res, 405, { erreurs: ['Méthode non autorisée'] });

  // Fichiers statiques, sans jamais sortir de dist/.
  let demande;
  try {
    demande = path.normalize(path.join(DIST, decodeURIComponent(url.pathname)));
  } catch {
    return json(res, 400, { erreurs: ['Chemin invalide'] });
  }
  if (demande !== DIST && !demande.startsWith(DIST + path.sep))
    return json(res, 400, { erreurs: ['Chemin invalide'] });
  fs.stat(demande, (err, stat) => {
    if (!err && stat.isFile()) return fichier(res, demande);
    fichier(res, path.join(DIST, 'index.html')); // navigation par # : tout revient à index.html
  });
});

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('dist/index.html introuvable : lancer « npm run build » avant « npm start ».');
  process.exit(1);
}

serveur.listen(PORT, () => {
  console.log(`${TITRE} sur http://localhost:${PORT} (données : ${path.join(RACINE, 'donnees')})`);
  if (!MOT_DE_PASSE)
    console.log(
      'Attention : aucun MOT_DE_PASSE défini, le site est accessible sans authentification.',
    );
});

for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => serveur.close(() => process.exit(0)));
