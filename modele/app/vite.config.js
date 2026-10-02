import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { JEUX, ecrireJeu, lireTout } from './scripts/donnees.js';

// En développement (npm run dev), expose /api/donnees pour lire toutes les données
// et /api/donnees/<jeu> pour enregistrer un fichier de donnees/ dans le dépôt.
function apiDonnees() {
  return {
    name: 'api-donnees',
    configureServer(server) {
      server.middlewares.use('/api/donnees', (req, res) => {
        const repondre = (code, corps) => {
          res.statusCode = code;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(corps));
        };
        const nom = req.url.replace(/^\/+|\/+$/g, '');
        if (req.method === 'GET' && !nom) return repondre(200, lireTout());
        if (req.method !== 'PUT' || !JEUX.includes(nom))
          return repondre(404, { erreurs: ['Route inconnue'] });

        let brut = '';
        req.on('data', (morceau) => (brut += morceau));
        req.on('end', () => {
          try {
            const erreurs = ecrireJeu(nom, JSON.parse(brut));
            if (erreurs.length) return repondre(400, { erreurs });
            repondre(200, { ok: true });
          } catch (e) {
            repondre(400, { erreurs: [e.message] });
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiDonnees()],
  // Chemins relatifs : le build fonctionne aussi depuis un sous-dossier (GitHub Pages).
  base: './',
  // Les données (donnees/) et les cours (NN-etape/) sont à la racine du dépôt, hors de app/.
  server: { fs: { allow: ['..'] } },
  // Mermaid est découpé en morceaux chargés à la demande, dont certains dépassent 500 ko.
  build: { chunkSizeWarningLimit: 1000 },
});
